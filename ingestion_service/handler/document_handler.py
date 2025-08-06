"""
Handler optimizado para procesamiento avanzado de documentos.
Mantiene 100% de compatibilidad con el sistema existente de Nooble8.
"""
import logging
import hashlib
import uuid
import re
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

# Imports seguros con fallbacks
import fitz  # PyMuPDF base - REQUERIDO
try:
    import pymupdf4llm  # Helper avanzado - OPCIONAL
    PYMUPDF4LLM_AVAILABLE = True
except ImportError:
    PYMUPDF4LLM_AVAILABLE = False
    
from docx import Document as DocxDocument  # REQUERIDO
import requests
from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter

from common.handlers.base_handler import BaseHandler
from ..models import DocumentIngestionRequest, ChunkModel, DocumentType
from ..config.settings import IngestionSettings


class DocumentHandler(BaseHandler):
    """
    Handler optimizado para procesamiento avanzado de documentos.
    Compatible con el sistema existente de Nooble8 Ingestion Service.
    """
    
    def __init__(self, app_settings: IngestionSettings):
        """Inicializa el handler con la configuración de la aplicación."""
        super().__init__(app_settings)
        # Cache de parsers por configuración
        self._parsers_cache = {}
        self._logger.info("DocumentHandler initialized with enhanced extraction")
        if PYMUPDF4LLM_AVAILABLE:
            self._logger.info("Advanced PDF extraction with pymupdf4llm available")
        else:
            self._logger.info("Using standard PDF extraction (pymupdf4llm not available)")
    
    def _get_parser(self, chunk_size: int, chunk_overlap: int) -> SentenceSplitter:
        """Obtiene o crea un parser con cache."""
        cache_key = f"{chunk_size}:{chunk_overlap}"
        if cache_key not in self._parsers_cache:
            self._parsers_cache[cache_key] = SentenceSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separator=" ",
                paragraph_separator="\n\n",
                secondary_chunking_regex="[^,.;。？！]+[,.;。？！]?"
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
        Procesa documento y retorna chunks manteniendo compatibilidad.
        
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
            # Cargar documento con método mejorado
            document, extraction_info = await self._load_document_enhanced(request)
            
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
            
            # Convertir a ChunkModel manteniendo estructura compatible
            chunks = []
            for idx, node in enumerate(nodes):
                # Crear ChunkModel con estructura compatible
                chunk = ChunkModel(
                    chunk_id=str(uuid.uuid4()),
                    document_id=document_id,
                    tenant_id=tenant_id,
                    content=node.get_content(),
                    chunk_index=idx,
                    collection_id=collection_id,
                    agent_ids=agent_ids if agent_ids else [],
                    metadata={
                        "document_name": request.document_name,
                        "document_type": doc_type_value,
                        "start_char_idx": getattr(node, 'start_char_idx', None),
                        "end_char_idx": getattr(node, 'end_char_idx', None),
                        "extraction_method": extraction_info.get("method", "standard"),
                        "has_tables": extraction_info.get("has_tables", False),
                        "page_count": extraction_info.get("page_count", None),
                        "chunk_word_count": len(node.get_content().split()),
                        **request.metadata  # Preservar metadata del request
                    }
                )
                chunks.append(chunk)
            
            self._logger.info(
                f"Document processed successfully: {len(chunks)} chunks",
                extra={
                    "document_id": document_id,
                    "document_name": request.document_name,
                    "document_type": doc_type_value,
                    "extraction_method": extraction_info.get("method"),
                    "chunk_size": request.rag_config.chunk_size,
                    "chunk_overlap": request.rag_config.chunk_overlap,
                    "total_chunks": len(chunks)
                }
            )
            return chunks
            
        except Exception as e:
            self._logger.error(f"Error processing document: {e}", exc_info=True)
            raise
    
    async def _load_document_enhanced(
        self, 
        request: DocumentIngestionRequest
    ) -> tuple[Document, Dict[str, Any]]:
        """
        Carga documento con extracción mejorada manteniendo compatibilidad.
        
        Returns:
            (Document, extraction_info) con metadata sobre la extracción
        """
        content = None
        extraction_info = {"method": "standard", "has_tables": False}
        
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
            file_path = Path(request.file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {request.file_path}")
            
            # Procesar según tipo de archivo con métodos avanzados
            if source_value == DocumentType.PDF.value:
                content, pdf_info = self._extract_pdf_enhanced(file_path)
                metadata["pages"] = pdf_info.get("page_count", 0)
                extraction_info.update(pdf_info)
                
            elif source_value == DocumentType.DOCX.value:
                content, docx_info = self._extract_docx_enhanced(file_path)
                extraction_info.update(docx_info)
                
            elif source_value == DocumentType.MARKDOWN.value:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                extraction_info["method"] = "markdown_native"
                extraction_info["is_markdown"] = True
                
            else:  # TXT y otros formatos de texto plano
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                extraction_info["method"] = "plain_text"
                
        elif request.url:
            # Cargar desde URL
            response = await self._fetch_url(str(request.url))
            content = response
            metadata["url"] = str(request.url)
            extraction_info["method"] = "url_fetch"
            
        elif request.content:
            # Contenido directo
            content = request.content
            extraction_info["method"] = "direct_content"
        else:
            raise ValueError("No content source provided")
        
        # Validar contenido
        if not content or not content.strip():
            raise ValueError("Document is empty or contains only whitespace")
        
        # Agregar info de extracción a metadata
        metadata["extraction_info"] = extraction_info
        
        return Document(
            text=content,
            metadata=metadata,
            id_=self._generate_doc_hash(content)
        ), extraction_info
    
    def _extract_pdf_enhanced(self, file_path: Path) -> tuple[str, Dict[str, Any]]:
        """
        Extrae texto de PDF con métodos mejorados.
        
        Returns:
            (contenido, info_dict) con información sobre la extracción
        """
        info = {"method": "standard", "has_tables": False, "page_count": 0}
        
        # Intentar extracción avanzada si está disponible
        if PYMUPDF4LLM_AVAILABLE:
            try:
                markdown_text = pymupdf4llm.to_markdown(
                    str(file_path),
                    page_chunks=False,
                    write_images=False,
                    show_progress=False
                )
                
                if markdown_text and markdown_text.strip():
                    info["method"] = "pymupdf4llm_markdown"
                    info["is_markdown"] = True
                    info["has_tables"] = '|' in markdown_text
                    with fitz.open(str(file_path)) as pdf:
                        info["page_count"] = len(pdf)
                    return markdown_text, info
                    
            except Exception as e:
                self._logger.debug(f"pymupdf4llm extraction failed: {e}")
        
        # Extracción estándar con PyMuPDF
        text_parts = []
        tables_found = False
        
        try:
            with fitz.open(str(file_path)) as pdf:
                info["page_count"] = len(pdf)
                
                for page_num, page in enumerate(pdf, 1):
                    page_text = page.get_text(sort=True)
                    
                    if page_text.strip():
                        text_parts.append(page_text)
                    
                    # Detección básica de tablas
                    try:
                        tables = page.find_tables()
                        if tables:
                            tables_found = True
                    except:
                        pass
            
            full_text = "\n\n".join(text_parts)
            
            if not full_text.strip():
                # Último fallback
                return self._fallback_pdf_extraction(file_path), {
                    "method": "llama_index_fallback",
                    "error": "No extractable text found"
                }
            
            info["method"] = "pymupdf_standard"
            info["has_tables"] = tables_found
            
            return full_text, info
            
        except Exception as e:
            self._logger.error(f"PDF extraction error: {e}")
            return self._fallback_pdf_extraction(file_path), {
                "method": "llama_index_fallback",
                "error": str(e)
            }
    
    def _fallback_pdf_extraction(self, file_path: Path) -> str:
        """Método de respaldo usando llama_index."""
        try:
            from llama_index.core import SimpleDirectoryReader
            reader = SimpleDirectoryReader(input_files=[str(file_path)])
            docs = reader.load_data()
            return "\n\n".join([doc.text for doc in docs])
        except Exception as e:
            self._logger.error(f"All PDF extraction methods failed: {e}")
            raise ValueError(f"Could not extract text from PDF: {e}")
    
    def _extract_docx_enhanced(self, file_path: Path) -> tuple[str, Dict[str, Any]]:
        """
        Extrae texto de DOCX preservando estructura.
        
        Returns:
            (contenido, info_dict)
        """
        info = {"method": "python-docx", "has_tables": False}
        
        try:
            doc = DocxDocument(str(file_path))
            paragraphs = []
            has_tables = False
            
            # Extraer párrafos
            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    paragraphs.append(text)
            
            # Extraer tablas
            if doc.tables:
                has_tables = True
                info["has_tables"] = True
                
                for table in doc.tables:
                    table_text = []
                    for row in table.rows:
                        row_data = []
                        for cell in row.cells:
                            cell_text = cell.text.strip()
                            row_data.append(cell_text)
                        if any(row_data):
                            table_text.append(" | ".join(row_data))
                    
                    if table_text:
                        paragraphs.append("\n[TABLE]\n" + "\n".join(table_text) + "\n[/TABLE]")
            
            content = "\n\n".join(paragraphs)
            
            if not content.strip():
                raise ValueError("DOCX file appears to be empty")
            
            return content, info
            
        except Exception as e:
            self._logger.error(f"DOCX extraction error: {e}")
            try:
                from llama_index.core import SimpleDirectoryReader
                reader = SimpleDirectoryReader(input_files=[str(file_path)])
                docs = reader.load_data()
                content = "\n\n".join([doc.text for doc in docs])
                return content, {"method": "llama_index_fallback", "error": str(e)}
            except Exception as e2:
                raise ValueError(f"Could not extract text from DOCX: {e2}")
    
    async def _fetch_url(self, url: str) -> str:
        """Descarga contenido desde URL."""
        try:
            response = requests.get(
                url, 
                timeout=30,
                headers={'User-Agent': 'Mozilla/5.0 (compatible; Nooble8/1.0)'}
            )
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            self._logger.error(f"Error fetching URL {url}: {e}")
            raise ValueError(f"Failed to fetch URL: {e}")
    
    def _generate_doc_hash(self, content: str) -> str:
        """Genera hash único para el documento."""
        return hashlib.sha256(content.encode()).hexdigest()[:16]