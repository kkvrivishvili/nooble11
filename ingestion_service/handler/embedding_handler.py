"""
Handler para coordinar con el servicio de embeddings.
"""
import logging
import uuid
from typing import List, Dict, Any

from common.handlers.base_handler import BaseHandler
from common.models.actions import DomainAction
from common.models.config_models import RAGConfig

from ..clients.embedding_client import EmbeddingClient
from ..models import ChunkModel
from ..config.settings import IngestionSettings


class EmbeddingHandler(BaseHandler):
    """Handler para gestionar embeddings de chunks."""
    
    def __init__(
        self,
        app_settings: IngestionSettings,
        embedding_client: EmbeddingClient
    ):
        super().__init__(app_settings)
        self.embedding_client = embedding_client
    
    async def generate_embeddings(
        self,
        chunks: List[ChunkModel],
        tenant_id: uuid.UUID,
        agent_id: uuid.UUID,
        task_id: uuid.UUID,
        rag_config: RAGConfig
    ) -> None:
        """
        Envía chunks para generar embeddings.
        La respuesta llegará asíncronamente via callback.
        """
        if not chunks:
            return
        
        # Preparar textos y IDs
        texts = [chunk.content for chunk in chunks]
        chunk_ids = [chunk.chunk_id for chunk in chunks]
        
        # Metadata adicional
        metadata = {
            "task_id": str(task_id),
            "tenant_id": str(tenant_id),
            "agent_id": str(agent_id),
            "total_chunks": len(chunks)
        }
        
        # Enviar a embedding service
        await self.embedding_client.generate_embeddings_batch(
            texts=texts,
            chunk_ids=chunk_ids,
            agent_id=str(agent_id),
            task_id=str(task_id),
            rag_config=rag_config,
            metadata=metadata
        )
        
        self._logger.info(
            f"Enviados {len(chunks)} chunks para embeddings",
            extra={"task_id": str(task_id)}
        )