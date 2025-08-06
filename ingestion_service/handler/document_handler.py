"""
Handler optimizado para procesamiento de documentos.
"""
import logging
import hashlib
import uuid
from typing import List, Dict, Any
from pathlib import Path

from llama_index.core import SimpleDirectoryReader, Document
from llama_index.core.node_parser import SentenceSplitter
import requests

from common.handlers.base_handler import BaseHandler
from ..models import DocumentIngestionRequest, ChunkModel, DocumentType
from ..config.settings import IngestionSettings


class DocumentHandler(BaseHandler):
    """Handler optimizado para procesamiento de documentos con cache de parsers."""
    
    def __init__(self, app_settings: IngestionSettings):
        super().__init__(app_settings)
        # Cache de parsers por configuración
        self._parsers_cache = {}
    
    def _get_parser(self, chunk_size: int, chunk_overlap: int) -> SentenceSplitter:
        """Obtiene o crea un parser con cache."""
        cache_key = f"{chunk_size}:{chunk_overlap}"
        if cache_key not in self._parsers_cache:
            self._parsers_cache[cache_key] = SentenceSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
        return self._parsers_cache[cache_key]
    
    async def process_document(
        self,
        request: DocumentIngestionRequest,
        document_id: str,
        tenant_id: str,
        collection_id: str,
        agent_ids: List[str]
    ) -> List[ChunkModel]:
        """
        Procesa documento y retorna chunks.
        
        Args:
            request: Request de ingestion con el documento
            document_id: ID del documento (UUID string)
            tenant_id: ID del tenant (UUID string)
            collection_id: ID de la colección
            agent_ids: Lista de agent IDs con acceso
            
        Returns:
            Lista de ChunkModel procesados
        """
        try:
            # Cargar documento
            document = await self._load_document(request)
            
            # Obtener parser con cache
            parser = self._get_parser(
                request.rag_config.chunk_size,
                request.rag_config.chunk_overlap
            )
            
            # Parsear en chunks
            nodes = parser.get_nodes_from_documents([document])
            
            # Obtener tipo de documento como string
            doc_type_value = (
                request.document_type.value 
                if hasattr(request.document_type, 'value')
                else str(request.document_type)
            )
            
            # Convertir a ChunkModel
            chunks = []
            for idx, node in enumerate(nodes):
                chunk = ChunkModel(
                    chunk_id=str(uuid.uuid4()),
                    document_id=document_id,
                    tenant_id=tenant_id,
                    content=node.get_content(),
                    chunk_index=idx,
                    collection_id=collection_id,
                    agent_ids=agent_ids or [],
                    metadata={
                        "document_name": request.document_name,
                        "document_type": doc_type_value,
                        "start_char_idx": getattr(node, 'start_char_idx', None),
                        "end_char_idx": getattr(node, 'end_char_idx', None),
                        **request.metadata
                    }
                )
                chunks.append(chunk)
            
            self._logger.info(
                f"Document processed: {len(chunks)} chunks",
                extra={
                    "document_id": document_id,
                    "document_name": request.document_name,
                    "chunk_size": request.rag_config.chunk_size,
                    "chunk_overlap": request.rag_config.chunk_overlap
                }
            )
            return chunks
            
        except Exception as e:
            self._logger.error(f"Error processing document: {e}", exc_info=True)
            raise
    
    async def _load_document(self, request: DocumentIngestionRequest) -> Document:
        """Carga documento desde diferentes fuentes."""
        content = None
        source_value = (
            request.document_type.value 
            if hasattr(request.document_type, 'value')
            else str(request.document_type)
        )
        metadata = {
            "source": source_value,
            "document_name": request.document_name
        }
        
        if request.file_path:
            # Cargar desde archivo
            file_path = Path(request.file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {request.file_path}")
            
            if source_value in [DocumentType.PDF.value, DocumentType.DOCX.value]:
                # Usar llama_index para PDFs y DOCX
                reader = SimpleDirectoryReader(input_files=[str(file_path)])
                docs = reader.load_data()
                content = "\n\n".join([doc.text for doc in docs])
            else:
                # Texto plano, markdown, etc.
                content = file_path.read_text(encoding='utf-8')
                
        elif request.url:
            # Cargar desde URL
            response = await self._fetch_url(str(request.url))
            content = response
            metadata["url"] = str(request.url)
            
        elif request.content:
            # Contenido directo
            content = request.content
        else:
            raise ValueError("No content source provided")
        
        # Validar contenido
        if not content or not content.strip():
            raise ValueError("Document is empty or contains only whitespace")
        
        return Document(
            text=content,
            metadata=metadata,
            id_=self._generate_doc_hash(content)
        )
    
    async def _fetch_url(self, url: str) -> str:
        """Descarga contenido desde URL."""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            self._logger.error(f"Error fetching URL {url}: {e}")
            raise ValueError(f"Failed to fetch URL: {e}")
    
    def _generate_doc_hash(self, content: str) -> str:
        """Genera hash único para el documento."""
        return hashlib.sha256(content.encode()).hexdigest()[:16]