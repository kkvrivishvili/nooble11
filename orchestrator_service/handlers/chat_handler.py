"""
Handler para procesamiento de mensajes de chat.
Orquesta la comunicación entre WebSocket y Execution Service.
"""
import logging
import uuid
from typing import Optional, Dict, Any

from common.handlers.base_handler import BaseHandler
from common.models.chat_models import ChatRequest, ChatMessage, ConversationHistory

from ..clients.execution_client import ExecutionClient
from ..websocket.orchestrator_websocket_manager import OrchestratorWebSocketManager
from .config_handler import ConfigHandler
from .session_handler import SessionHandler
from common.models.chat_models import ChatRequest
from ..config.settings import OrchestratorSettings

logger = logging.getLogger(__name__)


class ChatHandler(BaseHandler):
    """
    Handler para procesar mensajes de chat desde WebSocket.
    Coordina entre sesiones, configuraciones y execution service.
    """
    
    def __init__(
        self,
        app_settings: OrchestratorSettings,
        execution_client: ExecutionClient,
        config_handler: ConfigHandler,
        session_handler: SessionHandler,
        websocket_manager: OrchestratorWebSocketManager,
        direct_redis_conn=None
    ):
        super().__init__(app_settings, direct_redis_conn)
        self.execution_client = execution_client
        self.config_handler = config_handler
        self.session_handler = session_handler
        self.websocket_manager = websocket_manager
    
    async def process_chat_message(
        self,
        session_state: ConversationHistory,
        message_request: ChatRequest,
        connection_id: str
    ) -> None:
        """
        Procesa un mensaje de chat recibido por WebSocket.
        
        Args:
            session_state: Estado de la sesión
            message_request: Request de chat
            connection_id: ID de la conexión WebSocket
        """
        task_id = None
        
        try:
            # 1. Crear task_id si no existe
            task_id = message_request.task_id or await self.session_handler.create_task_id(
                session_state.session_id
            )
            
            self._logger.info(
                "Procesando mensaje de chat",
                extra={
                    "session_id": str(session_state.session_id),
                    "task_id": str(task_id),
                    "agent_id": str(session_state.agent_id),
                    "connection_id": connection_id
                }
            )
            
            # 2. Obtener configuraciones del agente
            configs = await self.config_handler.get_agent_configs(
                tenant_id=session_state.tenant_id,
                agent_id=session_state.agent_id,
                session_id=session_state.session_id,
                task_id=task_id
            )
            execution_config, query_config, rag_config = configs
            
            # 3. Completar el ChatRequest con IDs del contexto
            message_request.tenant_id = session_state.tenant_id
            message_request.session_id = session_state.session_id
            message_request.agent_id = session_state.agent_id
            message_request.task_id = task_id
            
            # 4. Determinar modo según presencia de tools
            mode = "advance" if message_request.tools else "simple"
            
            # 5. Notificar inicio de procesamiento
            await self.websocket_manager.send_to_session(
                session_id=session_state.session_id,
                message_type="chat_processing",
                data={
                    "task_id": str(task_id),
                    "status": "processing",
                    "mode": mode
                },
                task_id=task_id
            )
            
            # 6. Enviar a execution service
            await self.execution_client.execute_chat(
                chat_request=message_request,
                execution_config=execution_config,
                query_config=query_config,
                rag_config=rag_config,
                mode=mode
            )
            
            self._logger.info(
                "Mensaje enviado a execution service",
                extra={
                    "task_id": str(task_id),
                    "mode": mode
                }
            )
            
        except Exception as e:
            self._logger.error(
                f"Error procesando mensaje de chat: {e}",
                extra={
                    "session_id": str(session_state.session_id),
                    "task_id": str(task_id) if task_id else "unknown",
                    "error": str(e)
                }
            )
            
            # Enviar error al cliente
            await self.websocket_manager.send_error_to_session(
                session_id=session_state.session_id,
                error_type="chat_processing_error",
                message=str(e),
                task_id=task_id
            )