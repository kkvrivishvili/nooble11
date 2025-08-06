"""
Handler optimizado para procesamiento avanzado de documentos.
Mantiene 100% de compatibilidad con el sistema existente de Nooble8.
"""
import logging
import hashlib
import uuid
import re
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime

# Imports seguros con fallbacks
import fitz  # PyMuPDF base - REQUERIDO
import pymupdf4llm  # Helper avanzado - REQUERIDO (siempre debe estar disponible)
    
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
        self._logger.info("DocumentHandler initialized with pymupdf4llm as primary PDF extractor")
    
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
            
            # Limpieza avanzada de texto (excepto markdown)
            if not extraction_info.get("is_markdown", False):
                cleaned_text = self._clean_text(document.text)
                # Reconstruir documento con texto limpio
                document = Document(
                    text=cleaned_text,
                    metadata=document.metadata,
                    id_=document.id_
                )
            
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
                # Limpieza específica del chunk
                chunk_content = self._clean_chunk_content(node.get_content())
                
                # Crear ChunkModel con estructura compatible
                chunk = ChunkModel(
                    chunk_id=str(uuid.uuid4()),
                    document_id=document_id,
                    tenant_id=tenant_id,
                    content=chunk_content,
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
                        "chunk_word_count": len(chunk_content.split()),
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
        Carga documento con extracción mejorada usando siempre pymupdf4llm para PDFs
        
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
                content, pdf_info = self._extract_pdf_pymupdf4llm(file_path)
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
    
    def _extract_pdf_pymupdf4llm(self, file_path: Path) -> tuple[str, Dict[str, Any]]:
        """
        Extrae texto de PDF usando EXCLUSIVAMENTE pymupdf4llm
        
        Returns:
            (contenido, info_dict) con información sobre la extracción
        """
        try:
            markdown_text = pymupdf4llm.to_markdown(
                str(file_path),
                page_chunks=False,
                write_images=False,
                show_progress=False
            )
            
            if not markdown_text.strip():
                raise ValueError("pymupdf4llm returned empty content")
            
            # Contar páginas usando PyMuPDF
            with fitz.open(str(file_path)) as pdf:
                page_count = len(pdf)
            
            return markdown_text, {
                "method": "pymupdf4llm_markdown",
                "is_markdown": True,
                "has_tables": '|' in markdown_text,
                "page_count": page_count
            }
            
        except Exception as e:
            self._logger.error(f"pymupdf4llm extraction failed: {e}")
            raise RuntimeError(f"PDF extraction with pymupdf4llm failed: {e}")
    
    def _extract_docx_enhanced(self, file_path: Path) -> tuple[str, Dict[str, Any]]:
        """
        Extrae texto de DOCX preservando estructura.
        
        Returns:
            (contenido, info_dict)
        """
        try:
            doc = DocxDocument(str(file_path))
            paragraphs = []
            has_tables = False
            
            # Extraer párrafos con detección de encabezados
            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    # Detectar encabezados
                    if para.style and 'Heading' in para.style.name:
                        paragraphs.append(f"### {text}")
                    else:
                        paragraphs.append(text)
            
            # Extraer tablas
            if doc.tables:
                has_tables = True
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
            
            return content, {
                "method": "python-docx",
                "has_tables": has_tables
            }
            
        except Exception as e:
            self._logger.error(f"DOCX extraction error: {e}")
            raise RuntimeError(f"DOCX extraction failed: {e}")
    
    def _clean_text(self, text: str) -> str:
        """
        Limpia y normaliza el texto extraído.
        Preserva marcadores estructurales importantes.
        """
        # Preservar marcadores de tabla si existen
        if "[TABLE]" in text or "[/TABLE]" in text:
            # No limpiar agresivamente si hay tablas
            return self._gentle_clean(text)
        
        # Limpieza estándar
        # Eliminar caracteres de control excepto newlines y tabs
        text = ''.join(char for char in text if char == '\n' or char == '\t' or ord(char) >= 32)
        
        # Normalizar espacios múltiples
        text = re.sub(r' +', ' ', text)
        
        # Normalizar saltos de línea múltiples (máximo 2)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Eliminar espacios al inicio y final de líneas
        lines = text.split('\n')
        lines = [line.strip() for line in lines]
        text = '\n'.join(lines)
        
        # Eliminar líneas que solo contienen caracteres especiales repetidos
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            # Preservar líneas con contenido real
            if line and not all(c in '.-_=*~`#' for c in line):
                cleaned_lines.append(line)
            elif not line:  # Preservar líneas vacías para mantener párrafos
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _gentle_clean(self, text: str) -> str:
        """Limpieza suave para preservar tablas y estructura."""
        # Solo eliminar caracteres de control peligrosos
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')
        
        # Normalizar solo espacios excesivos (más de 3)
        text = re.sub(r'    +', '  ', text)
        
        # Normalizar saltos excesivos (más de 3)
        text = re.sub(r'\n{4,}', '\n\n\n', text)
        
        return text
    
    def _clean_chunk_content(self, content: str) -> str:
        """
        Limpieza mínima específica para chunks.
        Preserva formato importante.
        """
        # Eliminar espacios al inicio y final
        content = content.strip()
        
        # Si no hay indicadores de tabla, normalizar espacios
        if '[TABLE]' not in content and '|' not in content:
            # Normalizar espacios múltiples a uno solo
            content = ' '.join(content.split())
        
        return content
    
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