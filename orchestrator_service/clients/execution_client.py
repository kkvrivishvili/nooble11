"""
Cliente para comunicación con execution_service.
Usa DomainActions para comunicación asíncrona.
"""
import logging
import uuid
from typing import Optional, Dict, Any

from common.clients.base_redis_client import BaseRedisClient
from common.models.actions import DomainAction
from common.models.config_models import ExecutionConfig, QueryConfig, RAGConfig
from common.models.chat_models import ChatRequest

from ..config.settings import OrchestratorSettings

logger = logging.getLogger(__name__)


class ExecutionClient:
    """
    Cliente para enviar acciones al execution_service.
    Implementa comunicación asíncrona via DomainActions.
    """
    
    def __init__(
        self,
        redis_client: BaseRedisClient,
        settings: OrchestratorSettings
    ):
        self.redis_client = redis_client
        self.settings = settings
        self._logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    async def execute_chat(
        self,
        chat_request: ChatRequest,
        execution_config: ExecutionConfig,
        query_config: QueryConfig,
        rag_config: RAGConfig,
        mode: str = "simple"
    ) -> None:
        """
        Envía solicitud de chat al execution service.
        
        Args:
            chat_request: Request de chat con mensajes
            execution_config: Config para execution service
            query_config: Config para query service
            rag_config: Config para RAG
            mode: Modo de ejecución ("simple" o "advance")
        """
        # Determinar action_type
        action_type = f"execution.chat.{mode}"
        
        # Crear DomainAction con configuraciones separadas
        action = DomainAction(
            action_type=action_type,
            tenant_id=chat_request.tenant_id,
            session_id=chat_request.session_id,
            task_id=chat_request.task_id,
            agent_id=chat_request.agent_id,
            user_id=chat_request.user_id,
            origin_service=self.settings.service_name,
            # Configuraciones en campos dedicados
            execution_config=execution_config,
            query_config=query_config,
            rag_config=rag_config,
            # Callback para respuestas
            callback_action_type="orchestrator.chat.response",
            # Solo datos del chat
            data=chat_request.model_dump(
                exclude={'tenant_id', 'session_id', 'task_id', 'agent_id', 'user_id'}
            )
        )
        
        # Enviar asíncronamente con callback
        await self.redis_client.send_action_async_with_callback(
            action=action,
            callback_event_name="orchestrator.chat.response"
        )
        
        self._logger.info(
            f"Chat request enviado a execution service",
            extra={
                "action_id": str(action.action_id),
                "action_type": action_type,
                "task_id": str(chat_request.task_id),
                "mode": mode
            }
        )
    
    async def cancel_task(
        self,
        session_id: uuid.UUID,
        task_id: uuid.UUID,
        tenant_id: uuid.UUID,
        agent_id: uuid.UUID,
        reason: str = "user_requested"
    ) -> None:
        """
        Envía solicitud de cancelación de tarea.
        
        Args:
            session_id: ID de la sesión
            task_id: ID de la tarea a cancelar
            reason: Razón de la cancelación
        """
        action = DomainAction(
            action_type="execution.task.cancel",
            tenant_id=tenant_id,
            session_id=session_id,
            task_id=task_id,
            agent_id=agent_id,
            origin_service=self.settings.service_name,
            data={  
                "reason": reason
            }
        )
        
        await self.redis_client.send_action_async(action)
        
        self._logger.info(
            f"Cancelación enviada",
            extra={
                "session_id": str(session_id),
                "task_id": str(task_id),
                "reason": reason
            }
        )