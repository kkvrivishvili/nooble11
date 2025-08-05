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
        anon_key: str,
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
            
            self.client = create_client(url, anon_key, client_options)
            self.admin_client = None
            if service_key:
                self.admin_client = create_client(url, service_key, client_options)
            
            self.logger.info(f"Supabase client initialized with URL: {url}")
        except Exception as e:
            self.logger.warning(f"Supabase client initialization warning: {e}")
            # Create a minimal client that might still work for auth verification
            self.client = create_client(url, anon_key)
            self.admin_client = None
            if service_key:
                self.admin_client = create_client(url, service_key)
        
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
            
            # Crear AgentConfig
            agent_config = AgentConfig(
                agent_id=uuid.UUID(agent_data['id']),
                agent_name=agent_data['name'],
                tenant_id=uuid.UUID(agent_data['user_id']),  # Usar userId como tenant_id
                execution_config=agent_data['execution_config'],
                query_config=agent_data['query_config'],
                rag_config=agent_data['rag_config'],
                created_at=datetime.fromisoformat(agent_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(agent_data['updated_at'].replace('Z', '+00:00'))
            )
            
            # Agregar system_prompt a query_config si existe
            if 'system_prompt' in agent_data:
                agent_config.query_config.system_prompt_template = agent_data['system_prompt']
            
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
        return {
            'id': data.get('id'),
            'user_id': data.get('userId'),
            'template_id': data.get('templateId'),
            'name': data.get('name'),
            'description': data.get('description'),
            'icon': data.get('icon'),
            'system_prompt': data.get('systemPrompt'),  # De la vista
            'system_prompt_override': data.get('systemPromptOverride'),
            'query_config': data.get('queryConfig', {}),
            'rag_config': data.get('ragConfig', {}),
            'execution_config': data.get('executionConfig', {}),
            'is_active': data.get('isActive', True),
            'is_public': data.get('isPublic', True),
            'created_at': data.get('createdAt'),
            'updated_at': data.get('updatedAt')
        }
    
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
        try:
            # Verify token with Supabase
            response = await asyncio.to_thread(
                lambda: self.client.auth.get_user(token)
            )
            
            if not response.user:
                self.logger.warning("Invalid JWT token")
                return None
            
            user = response.user
            user_info = UserInfo(
                id=uuid.UUID(user.id),
                email=user.email,
                user_metadata=user.user_metadata or {},
                app_metadata=user.app_metadata or {},
                created_at=datetime.fromisoformat(user.created_at.replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(user.updated_at.replace('Z', '+00:00')) if user.updated_at else None
            )
            
            self.logger.debug(f"JWT verified for user {user.id}")
            return user_info
            
        except AuthError as e:
            self.logger.warning(f"JWT verification failed: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Error verifying JWT: {str(e)}")
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