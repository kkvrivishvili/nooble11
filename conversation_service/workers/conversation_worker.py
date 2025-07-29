"""
Worker para procesar DomainActions de conversaciones.
"""
import logging
from typing import Dict, Any, Optional

import redis.asyncio as redis_async

from common.workers.base_worker import BaseWorker
from common.models.actions import DomainAction
from common.supabase import SupabaseClient

from conversation_service.config.settings import ConversationSettings
from conversation_service.services.persistence_service import PersistenceService

logger = logging.getLogger(__name__)


class ConversationWorker(BaseWorker):
    """Worker para procesar acciones de conversación."""
    
    def __init__(
        self,
        app_settings: ConversationSettings,
        async_redis_conn: redis_async.Redis,
        consumer_id_suffix: Optional[str] = None,
        supabase_client: Optional[SupabaseClient] = None
    ):
        super().__init__(app_settings, async_redis_conn, consumer_id_suffix)
        
        self.settings: ConversationSettings = app_settings
        self.supabase_client = supabase_client
        self.persistence_service: Optional[PersistenceService] = None
        self._logger = logging.getLogger(f"{__name__}.{self.consumer_name}")
    
    async def initialize(self):
        """Inicializa el worker y sus dependencias."""
        await super().initialize()
        
        # Crear Supabase client si no se proporcionó
        if not self.supabase_client:
            self.supabase_client = SupabaseClient(
                url=self.settings.supabase_url,
                anon_key=self.settings.supabase_anon_key,
                service_key=self.settings.supabase_service_key,
                app_settings=self.settings
            )
        
        # Verificar conexión con Supabase
        health = await self.supabase_client.health_check()
        if health["status"] != "healthy":
            raise Exception(f"Supabase no está saludable: {health}")
        
        # Inicializar servicio de persistencia
        self.persistence_service = PersistenceService(self.supabase_client)
        
        self._logger.info(f"ConversationWorker inicializado")
    
    async def _handle_action(self, action: DomainAction) -> Optional[Dict[str, Any]]:
        """
        Maneja las acciones del dominio conversation.
        
        Acciones soportadas:
        - conversation.message.create: Guardar mensajes (fire-and-forget)
        - conversation.session.closed: Marcar sesión como cerrada (fire-and-forget)
        """
        action_type = action.action_type
        
        try:
            if action_type == "conversation.message.create":
                # Validar datos requeridos
                data = action.data
                required_fields = ["conversation_id", "user_message", "agent_message"]
                
                missing_fields = [field for field in required_fields if not data.get(field)]
                if missing_fields:
                    self._logger.error(
                        f"Campos faltantes en action.data: {missing_fields}",
                        extra={"action_id": str(action.action_id)}
                    )
                    return None
                
                # Fire-and-forget: guardar mensajes
                result = await self.persistence_service.save_conversation_exchange(
                    conversation_id=data.get("conversation_id"),
                    tenant_id=str(action.tenant_id),
                    session_id=str(action.session_id),
                    agent_id=str(action.agent_id) if action.agent_id else "",
                    user_message=data.get("user_message"),
                    agent_message=data.get("agent_message"),
                    message_id=data.get("message_id"),
                    metadata=data.get("metadata")
                )
                
                if result.get("success"):
                    self._logger.info(
                        f"Mensajes guardados exitosamente",
                        extra={
                            "conversation_id": result.get("conversation_id"),
                            "action_id": str(action.action_id)
                        }
                    )
                else:
                    self._logger.error(
                        f"Error guardando mensajes: {result.get('error')}",
                        extra={"action_id": str(action.action_id)}
                    )
                
                return None  # Fire-and-forget
            
            elif action_type == "conversation.session.closed":
                # Fire-and-forget: marcar sesión cerrada
                success = await self.persistence_service.mark_conversation_ended(
                    tenant_id=str(action.tenant_id),
                    session_id=str(action.session_id),
                    agent_id=str(action.agent_id) if action.agent_id else ""
                )
                
                if success:
                    self._logger.info(
                        f"Sesión marcada como cerrada",
                        extra={
                            "session_id": str(action.session_id),
                            "action_id": str(action.action_id)
                        }
                    )
                else:
                    self._logger.warning(
                        f"No se pudo marcar sesión como cerrada",
                        extra={
                            "session_id": str(action.session_id),
                            "action_id": str(action.action_id)
                        }
                    )
                
                return None  # Fire-and-forget
            
            else:
                self._logger.warning(
                    f"Acción no soportada: {action_type}",
                    extra={"action_id": str(action.action_id)}
                )
                return None
                
        except Exception as e:
            self._logger.error(
                f"Error procesando {action_type}: {str(e)}",
                extra={
                    "action_id": str(action.action_id),
                    "tenant_id": str(action.tenant_id),
                    "session_id": str(action.session_id),
                    "error_type": type(e).__name__
                },
                exc_info=True
            )
            return None  # Fire-and-forget, no propagamos errores