"""
Cliente Supabase unificado para todos los servicios.
Incluye cache, retry logic y manejo de errores.
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timedelta
import uuid

from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from postgrest.exceptions import APIError
from gotrue.errors import AuthError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from ..config.base_settings import CommonAppSettings
from .models import AgentConfig, TenantInfo, UserInfo
from .types import SupabaseResponse, SupabaseError


class SupabaseClient:
    """
    Cliente Supabase con funcionalidades avanzadas:
    - Cache automático con TTL
    - Retry logic para operaciones
    - Manejo de errores unificado
    - Soporte para operaciones batch
    """
    
    def __init__(
        self,
        url: str,
        anon_key: Optional[str] = None,
        service_key: Optional[str] = None,
        app_settings: Optional[CommonAppSettings] = None
    ):
        """
        Inicializa el cliente Supabase.
        
        Args:
            url: URL de Supabase
            anon_key: Clave anónima de Supabase
            service_key: Clave de servicio (para operaciones admin)
            app_settings: Configuración de la aplicación
        """
        self.url = url
        self.anon_key = anon_key
        self.service_key = service_key
        
        # Setup logging
        service_name = app_settings.service_name if app_settings else "supabase"
        self.logger = logging.getLogger(f"{service_name}.SupabaseClient")
        
        # Create clients with error handling
        try:
            # Configure client options for better error handling
            client_options = ClientOptions(
                auto_refresh_token=False,
                persist_session=False
            )
            
            self.client = None
            self.admin_client = None
            # Crear admin_client si hay service_key
            if service_key:
                self.admin_client = create_client(url, service_key, client_options)
            # Preferir anon si está disponible; si no, usar service_key como client principal
            if anon_key:
                self.client = create_client(url, anon_key, client_options)
            elif service_key:
                # Fallback seguro en procesos server-to-server
                self.client = self.admin_client
            else:
                raise ValueError("Supabase keys missing: provide at least anon_key or service_key")
            
            self.logger.info(f"Supabase client initialized with URL: {url}")
        except Exception as e:
            self.logger.warning(f"Supabase client initialization warning: {e}")
            # Create a minimal client that might still work for auth verification
            self.client = None
            self.admin_client = None
            if service_key:
                self.admin_client = create_client(url, service_key)
            if anon_key:
                self.client = create_client(url, anon_key)
            elif self.admin_client is not None:
                self.client = self.admin_client
            else:
                raise
        
        self.logger.info("Supabase client initialized")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def get_agent_config(self, agent_id: str) -> Optional[AgentConfig]:
        """
        Obtiene la configuración completa de un agente.
        Transforma de camelCase a snake_case.
        
        Args:
            agent_id: ID del agente
            
        Returns:
            AgentConfig o None si no se encuentra
        """
        try:
            response = await asyncio.to_thread(
                lambda: self.client.table('agents_with_prompt')
                .select('*')
                .eq('id', agent_id)
                .single()
                .execute()
            )
            
            if not response.data:
                self.logger.warning(f"Agent not found: {agent_id}")
                return None
            
            # Transformar datos de camelCase a snake_case
            agent_data = self._transform_agent_data(response.data)
            
            # Normalizar configuraciones anidadas y timestamps
            exec_cfg = self._normalize_execution_config(agent_data.get('execution_config') or {})
            query_cfg = self._normalize_query_config(agent_data.get('query_config') or {}, agent_data.get('system_prompt'))
            rag_cfg = self._normalize_rag_config(agent_data.get('rag_config') or {}, default_collections=["default"])            
            
            agent_config = AgentConfig(
                agent_id=uuid.UUID(agent_data['id']),
                agent_name=agent_data['name'],
                tenant_id=uuid.UUID(agent_data['user_id']),
                execution_config=exec_cfg,
                query_config=query_cfg,
                rag_config=rag_cfg,
                created_at=self._parse_datetime(agent_data.get('created_at')),
                updated_at=self._parse_datetime(agent_data.get('updated_at'))
            )
            
            self.logger.debug(f"Agent config loaded for {agent_id}")
            return agent_config
            
        except Exception as e:
            self.logger.error(f"Error getting agent config for {agent_id}: {str(e)}")
            raise SupabaseError(f"Failed to get agent config: {str(e)}")
    
    def _transform_agent_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforma datos de agente de camelCase a snake_case.
        
        Args:
            data: Datos del agente en camelCase
            
        Returns:
            Dict con datos en snake_case
        """
        # La vista agents_with_prompt devuelve snake_case.
        # Soportamos ambos formatos por compatibilidad (snake_case preferido).
        return {
            'id': data.get('id'),
            'user_id': data.get('user_id') or data.get('userId'),
            'template_id': data.get('template_id') or data.get('templateId'),
            'name': data.get('name'),
            'description': data.get('description'),
            'icon': data.get('icon'),
            'system_prompt': data.get('system_prompt') or data.get('systemPrompt'),
            'system_prompt_override': data.get('system_prompt_override') or data.get('systemPromptOverride'),
            'query_config': data.get('query_config') or data.get('queryConfig', {}),
            'rag_config': data.get('rag_config') or data.get('ragConfig', {}),
            'execution_config': data.get('execution_config') or data.get('executionConfig', {}),
            'is_active': (data.get('is_active') if 'is_active' in data else data.get('isActive', True)),
            'is_public': (data.get('is_public') if 'is_public' in data else data.get('isPublic', True)),
            'created_at': data.get('created_at') or data.get('createdAt'),
            'updated_at': data.get('updated_at') or data.get('updatedAt')
        }

    def _parse_datetime(self, value: Any) -> datetime:
        """Parsea timestamps que pueden venir como str ISO o datetime."""
        try:
            if isinstance(value, datetime):
                return value
            if isinstance(value, str):
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except Exception as e:
            self.logger.warning(f"Failed to parse datetime '{value}': {e}")
        return datetime.utcnow()

    def _normalize_execution_config(self, cfg: Dict[str, Any]) -> Dict[str, Any]:
        """Mapea y filtra execution_config a los campos soportados por ExecutionConfig."""
        normalized: Dict[str, Any] = {}
        # Mapeos desde esquema DB a modelo
        if 'history_ttl' in cfg:
            normalized['history_ttl'] = cfg['history_ttl']
        if 'history_window' in cfg:
            normalized['max_history_length'] = cfg['history_window']
        if 'max_history_length' in cfg:
            normalized['max_history_length'] = cfg['max_history_length']
        if 'history_enabled' in cfg:
            normalized['enable_history_cache'] = cfg['history_enabled']
        if 'timeout_seconds' in cfg:
            normalized['tool_timeout'] = cfg['timeout_seconds']
        if 'tool_timeout' in cfg:
            normalized['tool_timeout'] = cfg['tool_timeout']
        if 'max_iterations' in cfg:
            normalized['max_iterations'] = cfg['max_iterations']
        return normalized

    def _normalize_query_config(self, cfg: Dict[str, Any], system_prompt: Optional[str]) -> Dict[str, Any]:
        """Quita extras (p.ej. stream) y asegura system_prompt_template."""
        allowed = {
            'model', 'temperature', 'max_tokens', 'top_p',
            'frequency_penalty', 'presence_penalty', 'stop',
            'max_context_tokens', 'enable_parallel_search',
            'timeout', 'max_retries', 'system_prompt_template'
        }
        normalized = {k: v for k, v in cfg.items() if k in allowed}
        if 'system_prompt_template' not in normalized or not normalized['system_prompt_template']:
            normalized['system_prompt_template'] = system_prompt or ""
        return normalized

    def _normalize_rag_config(self, cfg: Dict[str, Any], default_collections: Optional[List[str]] = None) -> Dict[str, Any]:
        """Quita extras y asegura collection_ids."""
        allowed = {
            'collection_ids', 'document_ids', 'embedding_model',
            'embedding_dimensions', 'encoding_format', 'top_k',
            'similarity_threshold', 'timeout', 'max_retries', 'max_text_length'
        }
        normalized = {k: v for k, v in cfg.items() if k in allowed}
        if not normalized.get('collection_ids'):
            normalized['collection_ids'] = (default_collections or ["default"]) 
        if 'encoding_format' not in normalized:
            normalized['encoding_format'] = 'float'
        return normalized
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def get_tenant_info(self, tenant_id: str) -> Optional[TenantInfo]:
        """
        Obtiene información básica de un tenant.
        Método genérico sin cache.
        
        Args:
            tenant_id: ID del tenant
            
        Returns:
            TenantInfo o None si no se encuentra
        """
        try:
            response = await asyncio.to_thread(
                lambda: self.client.table('tenants')
                .select('id, name, plan_type, settings, created_at, updated_at')
                .eq('id', tenant_id)
                .single()
                .execute()
            )
            
            if not response.data:
                self.logger.warning(f"Tenant not found: {tenant_id}")
                return None
            
            tenant_info = TenantInfo(**response.data)
            self.logger.debug(f"Tenant info loaded for {tenant_id}")
            return tenant_info
            
        except Exception as e:
            self.logger.error(f"Error getting tenant info for {tenant_id}: {str(e)}")
            raise SupabaseError(f"Failed to get tenant info: {str(e)}")
    
    
    # Authentication Methods
    async def verify_jwt_token(self, token: str) -> Optional[UserInfo]:
        """
        Verifica un token JWT y obtiene información del usuario.
        
        Args:
            token: Token JWT de Supabase
            
        Returns:
            UserInfo o None si el token es inválido
        """
        self.logger.info(f"Starting JWT verification with URL: {self.url}")
        self.logger.debug(f"Token (first 20 chars): {token[:20]}...")
        
        try:
            # Test basic connectivity first
            import requests
            try:
                test_url = f"{self.url}/auth/v1/user"
                self.logger.info(f"Testing connectivity to: {test_url}")
                test_response = requests.get(test_url, timeout=5)
                self.logger.info(f"Connectivity test status: {test_response.status_code}")
            except Exception as conn_e:
                self.logger.error(f"Connectivity test failed: {conn_e}")
            
            # Verify token with Supabase
            self.logger.info("Attempting JWT verification with Supabase client")
            response = await asyncio.to_thread(
                lambda: self.client.auth.get_user(token)
            )
            
            self.logger.info(f"Supabase response received: {type(response)}")
            
            if not response.user:
                self.logger.warning("Invalid JWT token - no user in response")
                return None
            
            user = response.user
            self.logger.info(f"User found: {user.id}, email: {user.email}")
            
            # created_at/updated_at may be str (ISO) or datetime, depending on library version
            def _parse_dt(value):
                try:
                    if isinstance(value, datetime):
                        return value
                    if isinstance(value, str):
                        # Normalize Zulu timezone to +00:00
                        return datetime.fromisoformat(value.replace('Z', '+00:00'))
                except Exception as dt_e:
                    self.logger.warning(f"Failed to parse datetime '{value}': {dt_e}")
                return None

            created_dt = _parse_dt(getattr(user, 'created_at', None)) or datetime.utcnow()
            updated_dt = _parse_dt(getattr(user, 'updated_at', None))

            user_info = UserInfo(
                id=uuid.UUID(user.id),
                email=user.email,
                user_metadata=user.user_metadata or {},
                app_metadata=user.app_metadata or {},
                created_at=created_dt,
                updated_at=updated_dt
            )
            
            self.logger.info(f"JWT verified successfully for user {user.id}")
            return user_info
            
        except AuthError as e:
            self.logger.error(f"JWT AuthError - Code: {getattr(e, 'code', 'unknown')}, Message: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"JWT verification exception - Type: {type(e).__name__}, Message: {str(e)}")
            import traceback
            self.logger.error(f"Full traceback: {traceback.format_exc()}")
            return None
    
    async def check_tenant_membership(self, user_id: str, tenant_id: str) -> bool:
        """
        Verifica si un usuario pertenece a un tenant.
        
        Args:
            user_id: ID del usuario
            tenant_id: ID del tenant
            
        Returns:
            bool: True si el usuario pertenece al tenant
        """
        try:
            response = await asyncio.to_thread(
                lambda: self.client.table('user_tenants')
                .select('id')
                .eq('user_id', user_id)
                .eq('tenant_id', tenant_id)
                .single()
                .execute()
            )
            
            return response.data is not None
            
        except Exception as e:
            self.logger.error(f"Error checking tenant membership: {str(e)}")
            return False
    

    

    
    # Health Check
    async def health_check(self) -> Dict[str, Any]:
        """
        Verifica que el cliente Supabase esté inicializado correctamente.
        
        Returns:
            Dict con información de salud
        """
        try:
            # Simple check - just verify the client is initialized and has required attributes
            if not hasattr(self, 'client') or self.client is None:
                raise Exception("Supabase client not initialized")
            
            # Check if client has required attributes
            if not hasattr(self.client, 'auth') or not hasattr(self.client, 'table'):
                raise Exception("Supabase client missing required attributes")
            
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "client_initialized": True,
                "has_auth": hasattr(self.client, 'auth'),
                "has_table": hasattr(self.client, 'table')
            }
            
        except Exception as e:
            self.logger.error(f"Supabase health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def get_public_agent_config(self, agent_id: str) -> Optional[AgentConfig]:
        """
        Obtiene configuración de agente SOLO si es público y activo.
        """
        try:
            response = await asyncio.to_thread(
                lambda: self.client.table('agents_with_prompt')
                .select('*')
                .eq('id', agent_id)
                .eq('is_public', True)
                .eq('is_active', True)
                .single()
                .execute()
            )
            
            if not response.data:
                self.logger.warning(f"Agent not found/public/inactive: {agent_id}")
                return None
            
            agent_data = self._transform_agent_data(response.data)
            
            exec_cfg = self._normalize_execution_config(agent_data.get('execution_config') or {})
            query_cfg = self._normalize_query_config(agent_data.get('query_config') or {}, agent_data.get('system_prompt'))
            rag_cfg = self._normalize_rag_config(agent_data.get('rag_config') or {}, default_collections=["default"])            
            
            return AgentConfig(
                agent_id=uuid.UUID(agent_data['id']),
                agent_name=agent_data['name'],
                tenant_id=uuid.UUID(agent_data['user_id']),
                execution_config=exec_cfg,
                query_config=query_cfg,
                rag_config=rag_cfg,
                created_at=self._parse_datetime(agent_data.get('created_at')),
                updated_at=self._parse_datetime(agent_data.get('updated_at'))
            )
        except Exception as e:
            self.logger.error(f"Error getting public agent config: {str(e)}")
            raise SupabaseError(f"Failed to get public agent config: {str(e)}")

# (método get_public_agent_config movido dentro de la clase SupabaseClient)