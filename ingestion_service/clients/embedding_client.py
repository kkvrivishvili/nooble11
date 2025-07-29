"""
Cliente mejorado para comunicación con embedding service.
"""
import logging
import uuid
from typing import List, Dict, Any

from common.clients.base_redis_client import BaseRedisClient
from common.models.actions import DomainAction
from common.models.config_models import RAGConfig


class EmbeddingClient:
    """Cliente para comunicación con embedding service."""
    
    def __init__(self, redis_client: BaseRedisClient):
        self.redis_client = redis_client
        self._logger = logging.getLogger(__name__)
    
    async def generate_embeddings_batch(
        self,
        texts: List[str],
        chunk_ids: List[str],
        agent_id: str,
        task_id: str,
        rag_config: RAGConfig,
        metadata: Dict[str, Any]
    ) -> None:
        """
        Envía batch de textos para generar embeddings.
        La respuesta llegará vía callback.
        """
        action = DomainAction(
            action_type="embedding.batch_process",
            tenant_id=uuid.UUID(metadata["tenant_id"]),
            agent_id=uuid.UUID(agent_id),
            task_id=uuid.UUID(task_id),
            session_id=uuid.uuid4(),  # No hay sesión real
            origin_service="ingestion-service",
            rag_config=rag_config,
            callback_action_type="ingestion.embedding_callback",
            data={
                "texts": texts,
                "chunk_ids": chunk_ids,
                "model": rag_config.embedding_model.value
            },
            metadata=metadata
        )
        
        await self.redis_client.send_action_async_with_callback(
            action=action,
            callback_event_name="ingestion.embedding_callback"
        )
        
        self._logger.info(
            f"Enviados {len(texts)} textos para embeddings",
            extra={"task_id": task_id}
        )