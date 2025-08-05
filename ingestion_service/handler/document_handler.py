"""
Handler para procesamiento de documentos.
"""
import logging
import hashlib
from typing import List, Dict, Any
from pathlib import Path

from llama_index.core import SimpleDirectoryReader, Document
from llama_index.core.node_parser import SentenceSplitter
import requests

from common.handlers.base_handler import BaseHandler
from ..models import DocumentIngestionRequest, ChunkModel, DocumentType
from ..config.settings import IngestionSettings


class DocumentHandler(BaseHandler):
    """Handler para procesar documentos y generar chunks."""
    
    def __init__(self, app_settings: IngestionSettings):
        super().__init__(app_settings)
        self.chunk_parser = SentenceSplitter()
    
    async def process_document(
        self,
        request: DocumentIngestionRequest,
        document_id: str,
        tenant_id: str,
        collection_id: str,
        agent_ids: List[str]
    ) -> List[ChunkModel]:
        """Procesa documento y retorna chunks."""
        try:
            # Cargar documento
            document = await self._load_document(request)
            
            # Configurar parser
            # Obtener parámetros de chunking desde la RAG config del request
            cfg = getattr(request, "rag_config", None)
            chunk_size = getattr(cfg, "chunk_size", 512)
            chunk_overlap = getattr(cfg, "chunk_overlap", 50)

            self.chunk_parser = SentenceSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            
            # Parsear en chunks
            nodes = self.chunk_parser.get_nodes_from_documents([document])
            
            # Normalizar document_type a string por si viene como str
            try:
                doc_type_value = (
                    request.document_type.value
                    if hasattr(request, "document_type") and hasattr(request.document_type, "value")
                    else str(getattr(request, "document_type", ""))
                )
            except Exception:
                doc_type_value = str(getattr(request, "document_type", ""))

            # Convertir a ChunkModel
            chunks = []
            for idx, node in enumerate(nodes):
                chunk = ChunkModel(
                    document_id=document_id,
                    tenant_id=tenant_id,
                    content=node.get_content(),
                    chunk_index=idx,
                    collection_id=collection_id,
                    agent_ids=agent_ids or [],
                    metadata={
                        **request.metadata,
                        "document_name": request.document_name,
                        "document_type": doc_type_value,
                        "start_char_idx": getattr(node, 'start_char_idx', None),
                        "end_char_idx": getattr(node, 'end_char_idx', None)
                    }
                )
                chunks.append(chunk)
            
            self._logger.info(f"Documento procesado en {len(chunks)} chunks")
            return chunks
            
        except Exception as e:
            self._logger.error(f"Error procesando documento: {e}")
            raise
    
    async def _load_document(self, request: DocumentIngestionRequest) -> Document:
        """Carga documento desde diferentes fuentes."""
        content = None
        # Normalizar document_type a string por si viene como str
        source_value = (
            request.document_type.value
            if hasattr(request, "document_type") and hasattr(request.document_type, "value")
            else str(getattr(request, "document_type", ""))
        )
        metadata = {"source": source_value}
        
        if request.file_path:
            file_path = Path(request.file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {request.file_path}")
            
            if source_value in [DocumentType.PDF.value, DocumentType.DOCX.value]:
                reader = SimpleDirectoryReader(input_files=[str(file_path)])
                docs = reader.load_data()
                content = "\n\n".join([doc.text for doc in docs])
            else:
                content = file_path.read_text(encoding='utf-8')
                
        elif request.url:
            response = await self._fetch_url(str(request.url))
            content = response
            metadata["url"] = str(request.url)
            
        elif request.content:
            content = request.content
        else:
            raise ValueError("No content source provided")
        
        return Document(
            text=content,
            metadata=metadata,
            id_=self._generate_doc_hash(content)
        )
    
    async def _fetch_url(self, url: str) -> str:
        """Descarga contenido desde URL."""
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    
    def _generate_doc_hash(self, content: str) -> str:
        """Genera hash único para el documento."""
        return hashlib.sha256(content.encode()).hexdigest()