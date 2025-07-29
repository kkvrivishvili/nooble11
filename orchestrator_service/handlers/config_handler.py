"""
Handler para gestión de configuraciones de agentes.
Maneja cache y recuperación desde Supabase.
"""
import logging
import uuid
from typing import Tuple, Optional, Dict, Any

from common.handlers.base_handler import BaseHandler
from common.models.config_models import ExecutionConfig, QueryConfig, RAGConfig
from common.clients.redis.cache_manager import CacheManager
from common.supabase.client import SupabaseClient

from ..config.settings import OrchestratorSettings

logger = logging.getLogger(__name__)


class ConfigHandler(BaseHandler):
    """
    Handler para gestión de configuraciones de agentes.
    Implementa cache de dos niveles: local + Redis.
    """
    
    def __init__(
        self,
        app_settings: OrchestratorSettings,
        supabase_client: SupabaseClient,
        direct_redis_conn=None
    ):
        super().__init__(app_settings, direct_redis_conn)
        self.supabase_client = supabase_client
        
        # Cache manager para configuraciones
        self.cache_manager = CacheManager[Dict[str, Any]](
            redis_conn=direct_redis_conn,
            state_model=dict,
            app_settings=app_settings,
            default_ttl=app_settings.config_cache_ttl
        )
        
        # Cache local en memoria (nivel 1)
        self._local_cache: Dict[str, Tuple[Dict[str, Any], float]] = {}
    
    async def get_agent_configs(
        self,
        tenant_id: uuid.UUID,
        agent_id: uuid.UUID,
        session_id: uuid.UUID,
        task_id: uuid.UUID
    ) -> Tuple[ExecutionConfig, QueryConfig, RAGConfig]:
        """
        Obtiene las configuraciones del agente con cache de dos niveles.
        
        Args:
            tenant_id: ID del tenant
            agent_id: ID del agente
            session_id: ID de la sesión
            task_id: ID de la tarea
            
        Returns:
            Tupla con las tres configuraciones
        """
        cache_key = f"{tenant_id}:{agent_id}"
        
        try:
            # 1. Verificar cache local
            if cache_key in self._local_cache:
                cached_data, _ = self._local_cache[cache_key]
                self._logger.debug(f"Config obtenida de cache local: {cache_key}")
                return self._parse_configs(cached_data)
            
            # 2. Verificar cache Redis
            cached_data = await self.cache_manager.get(
                cache_type="agent_config",
                context=[str(tenant_id), str(agent_id)]
            )
            
            if cached_data:
                self._local_cache[cache_key] = (cached_data, self._get_timestamp())
                self._logger.debug(f"Config obtenida de cache Redis: {cache_key}")
                return self._parse_configs(cached_data)
            
            # 3. Obtener de Supabase
            self._logger.info(f"Obteniendo config de Supabase: {cache_key}")
            
            agent_data = await self._fetch_from_supabase(tenant_id, agent_id)
            
            if not agent_data:
                raise ValueError(f"Agente no encontrado: {agent_id}")
            
            # 4. Guardar en caches
            await self._save_to_cache(tenant_id, agent_id, agent_data)
            
            return self._parse_configs(agent_data)
            
        except Exception as e:
            self._logger.error(f"Error obteniendo configuraciones: {e}")
            # Retornar configuraciones por defecto en caso de error
            return self._get_default_configs()
    
    async def invalidate_agent_config(
        self,
        tenant_id: uuid.UUID,
        agent_id: uuid.UUID
    ) -> None:
        """Invalida la configuración de un agente en todos los caches."""
        cache_key = f"{tenant_id}:{agent_id}"
        
        # Remover de cache local
        self._local_cache.pop(cache_key, None)
        
        # Remover de cache Redis
        await self.cache_manager.delete(
            cache_type="agent_config",
            context=[str(tenant_id), str(agent_id)]
        )
        
        self._logger.info(f"Config invalidada: {cache_key}")
    
    async def _fetch_from_supabase(
        self,
        tenant_id: uuid.UUID,
        agent_id: uuid.UUID
    ) -> Optional[Dict[str, Any]]:
        """Obtiene configuración desde Supabase."""
        try:
            # Usar el cliente Supabase
            response = await self.supabase_client.client.table('agents').select(
                'id, name, tenant_id, execution_config, query_config, rag_config'
            ).eq('tenant_id', str(tenant_id)).eq('id', str(agent_id)).single().execute()
            
            if response.data:
                return response.data
            return None
            
        except Exception as e:
            self._logger.error(f"Error obteniendo de Supabase: {e}")
            return None
    
    async def _save_to_cache(
        self,
        tenant_id: uuid.UUID,
        agent_id: uuid.UUID,
        agent_data: Dict[str, Any]
    ) -> None:
        """Guarda configuración en ambos niveles de cache."""
        cache_key = f"{tenant_id}:{agent_id}"
        
        # Guardar en cache Redis
        await self.cache_manager.save(
            cache_type="agent_config",
            context=[str(tenant_id), str(agent_id)],
            data=agent_data
        )
        
        # Guardar en cache local
        self._local_cache[cache_key] = (agent_data, self._get_timestamp())
    
    def _parse_configs(
        self,
        agent_data: Dict[str, Any]
    ) -> Tuple[ExecutionConfig, QueryConfig, RAGConfig]:
        """Parsea las configuraciones desde los datos del agente."""
        execution_config = ExecutionConfig.model_validate(
            agent_data.get("execution_config", {})
        )
        query_config = QueryConfig.model_validate(
            agent_data.get("query_config", {})
        )
        rag_config = RAGConfig.model_validate(
            agent_data.get("rag_config", {})
        )
        
        return execution_config, query_config, rag_config
    
    def _get_default_configs(self) -> Tuple[ExecutionConfig, QueryConfig, RAGConfig]:
        """Retorna configuraciones por defecto."""
        return (
            ExecutionConfig(),
            QueryConfig(
                model="llama-3.3-70b-versatile",
                system_prompt_template="Eres un asistente útil."
            ),
            RAGConfig(collection_ids=["default"])
        )
    
    def _get_timestamp(self) -> float:
        """Obtiene timestamp actual."""
        import time
        return time.time()
    
    async def cleanup_local_cache(self) -> None:
        """Limpia entradas expiradas del cache local."""
        current_time = self._get_timestamp()
        ttl = self.app_settings.config_cache_ttl
        
        expired_keys = [
            key for key, (_, timestamp) in self._local_cache.items()
            if current_time - timestamp > ttl
        ]
        
        for key in expired_keys:
            self._local_cache.pop(key, None)
        
        if expired_keys:
            self._logger.debug(f"Limpiadas {len(expired_keys)} entradas del cache local")