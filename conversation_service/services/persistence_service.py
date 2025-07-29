"""
Servicio de persistencia con Supabase.
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from common.supabase import SupabaseClient, SupabaseError
from conversation_service.models.conversation import Conversation, Message

logger = logging.getLogger(__name__)


class PersistenceService:
    """Servicio para persistir conversaciones en Supabase."""
    
    def __init__(self, supabase_client: SupabaseClient):
        self.supabase = supabase_client
        self._logger = logging.getLogger(f"{__name__}.PersistenceService")
    
    async def save_conversation_exchange(
        self,
        conversation_id: str,
        tenant_id: str,
        session_id: str,
        agent_id: str,
        user_message: str,
        agent_message: str,
        message_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Guarda un intercambio completo de conversación.
        
        Args:
            conversation_id: ID de la conversación
            tenant_id: ID del tenant
            session_id: ID de la sesión
            agent_id: ID del agente
            user_message: Mensaje del usuario
            agent_message: Respuesta del agente
            message_id: ID del mensaje (opcional)
            metadata: Metadata adicional
            
        Returns:
            Dict con el resultado de la operación
        """
        try:
            # Validar inputs
            if not all([conversation_id, tenant_id, session_id, agent_id, user_message, agent_message]):
                raise ValueError("Faltan campos requeridos para guardar conversación")
            
            # 1. Verificar si la conversación existe o crearla
            conversation = await self._get_or_create_conversation(
                conversation_id=conversation_id,
                tenant_id=tenant_id,
                session_id=session_id,
                agent_id=agent_id
            )
            
            # 2. Guardar mensaje del usuario
            user_msg = Message(
                conversation_id=conversation_id,
                role="user",
                content=user_message,
                metadata=metadata or {}
            )
            
            await self._save_message(user_msg)
            
            # 3. Guardar respuesta del agente
            agent_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=agent_message,
                metadata=metadata or {}
            )
            
            await self._save_message(agent_msg)
            
            self._logger.info(
                f"Intercambio guardado en conversación {conversation_id}",
                extra={
                    "tenant_id": tenant_id,
                    "session_id": session_id,
                    "agent_id": agent_id,
                    "message_count": 2
                }
            )
            
            return {
                "success": True,
                "conversation_id": conversation_id,
                "user_message_id": user_msg.id,
                "agent_message_id": agent_msg.id
            }
            
        except SupabaseError as e:
            self._logger.error(f"Error de Supabase: {str(e)}")
            return {
                "success": False,
                "error": f"Database error: {str(e)}"
            }
        except Exception as e:
            self._logger.error(f"Error guardando intercambio: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def mark_conversation_ended(
        self,
        tenant_id: str,
        session_id: str,
        agent_id: str
    ) -> bool:
        """Marca una conversación como finalizada."""
        try:
            # Validar inputs
            if not all([tenant_id, session_id, agent_id]):
                self._logger.warning("Faltan campos requeridos para cerrar conversación")
                return False
            
            # Buscar y actualizar conversación activa
            response = await self.supabase.client.table('conversations')\
                .update({
                    "is_active": False,
                    "ended_at": datetime.utcnow().isoformat()
                })\
                .eq('tenant_id', tenant_id)\
                .eq('session_id', session_id)\
                .eq('agent_id', agent_id)\
                .eq('is_active', True)\
                .execute()
            
            if response.data:
                self._logger.info(
                    f"Conversación marcada como finalizada",
                    extra={
                        "tenant_id": tenant_id,
                        "session_id": session_id,
                        "agent_id": agent_id,
                        "conversations_updated": len(response.data)
                    }
                )
                return True
            
            self._logger.warning(
                f"No se encontró conversación activa para cerrar",
                extra={
                    "tenant_id": tenant_id,
                    "session_id": session_id,
                    "agent_id": agent_id
                }
            )
            return False
            
        except Exception as e:
            self._logger.error(f"Error marcando conversación como finalizada: {str(e)}")
            return False
    
    async def _get_or_create_conversation(
        self,
        conversation_id: str,
        tenant_id: str,
        session_id: str,
        agent_id: str
    ) -> Conversation:
        """Obtiene o crea una conversación."""
        try:
            # Intentar obtener conversación existente
            response = await self.supabase.client.table('conversations')\
                .select('*')\
                .eq('id', conversation_id)\
                .single()\
                .execute()
            
            if response.data:
                return Conversation(**response.data)
            
        except Exception:
            # Si no existe, la creamos
            pass
        
        # Crear nueva conversación
        new_conversation = Conversation(
            id=conversation_id,
            tenant_id=tenant_id,
            session_id=session_id,
            agent_id=agent_id
        )
        
        await self.supabase.client.table('conversations')\
            .insert(new_conversation.model_dump())\
            .execute()
        
        self._logger.info(f"Nueva conversación creada: {conversation_id}")
        return new_conversation
    
    async def _save_message(self, message: Message) -> None:
        """Guarda un mensaje en Supabase."""
        await self.supabase.client.table('messages')\
            .insert(message.model_dump())\
            .execute()