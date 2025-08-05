"""
Servicio principal de ingestion corregido.
Cambios clave: RAG config desde request, no del agente.
"""
import asyncio
import json
import logging
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
import tempfile

import aiofiles

from fastapi import UploadFile
from common.services.base_service import BaseService
from common.models.actions import DomainAction
from common.clients.base_redis_client import BaseRedisClient
from common.supabase.client import SupabaseClient

from ..models import (
    DocumentIngestionRequest,
    IngestionStatus,
    ChunkModel,
    RAGConfigRequest
)
from ..handler import DocumentHandler, QdrantHandler
from ..config.settings import IngestionSettings

logger = logging.getLogger(__name__)


class IngestionService(BaseService):
    """
    Servicio principal de ingestion corregido.
    """
    
    def __init__(
        self,
        app_settings: IngestionSettings,
        service_redis_client: Optional[BaseRedisClient] = None,
        direct_redis_conn = None,
        supabase_client: Optional[SupabaseClient] = None,
        qdrant_client = None,
        embedding_client = None
    ):
        """Inicializa el servicio de ingestion."""
        super().__init__(app_settings, service_redis_client, direct_redis_conn)
        
        # Almacenar dependencias
        self.supabase_client = supabase_client
        self.qdrant_client = qdrant_client
        self.embedding_client = embedding_client
        
        # Handlers se inicializan en initialize()
        self.document_handler = None
        self.qdrant_handler = None
        self.websocket_manager = None
        
        # Cache de tareas en progreso
        self._tasks = {}
    
    async def process_action(self, action: DomainAction) -> Optional[Dict[str, Any]]:
        """
        Procesa una DomainAction de ingestion.
        
        Tipos de acciones soportadas:
        - ingestion.document.process: Procesar un documento
        - ingestion.document.status: Obtener estado de procesamiento
        - ingestion.document.agents.update: Actualizar agentes de un documento
        """
        try:
            action_type = action.action_type
            self._logger.info(
                f"Procesando acción: {action_type}",
                extra={
                    "action_id": str(action.action_id),
                    "tenant_id": action.tenant_id,
                    "session_id": action.session_id
                }
            )

            # Validar acción
            if not action.data:
                raise ValueError("El campo data está vacío")
            if not action.task_id:
                raise ValueError("task_id es requerido")

            # Enrutar según tipo de acción
            if action_type == "ingestion.document.process":
                return await self._handle_document_process(action)
            elif action_type == "ingestion.document.status":
                return await self._handle_document_status(action)
            elif action_type == "ingestion.document.agents.update":
                return await self._handle_agents_update(action)
            else:
                raise ValueError(f"Tipo de acción no soportado: {action_type}")

        except Exception as e:
            self._logger.error(f"Error procesando acción: {e}", exc_info=True)
            raise
    
    async def _handle_document_process(self, action: DomainAction) -> Dict[str, Any]:
        """Maneja el procesamiento de documentos."""
        # TODO: Implementar lógica de procesamiento de documentos
        return {
            "status": "processing",
            "task_id": action.task_id,
            "message": "Document processing started"
        }
    
    async def _handle_document_status(self, action: DomainAction) -> Dict[str, Any]:
        """Maneja consultas de estado de documentos."""
        task_id = action.data.get("task_id")
        if task_id and task_id in self._tasks:
            task = self._tasks[task_id]
            return {
                "task_id": task_id,
                "status": task["status"].value if hasattr(task["status"], 'value') else task["status"],
                "progress": {
                    "total_chunks": task.get("total_chunks", 0),
                    "processed_chunks": task.get("processed_chunks", 0)
                }
            }
        else:
            return {
                "task_id": task_id,
                "status": "not_found",
                "message": "Task not found"
            }
    
    async def _handle_agents_update(self, action: DomainAction) -> Dict[str, Any]:
        """Maneja actualización de agentes de documentos."""
        # TODO: Implementar lógica de actualización de agentes
        return {
            "status": "updated",
            "task_id": action.task_id,
            "message": "Agents updated successfully"
        }
    
    async def initialize(self):
        """Inicializa handlers y componentes del servicio."""
        try:
            self._logger.info("Inicializando IngestionService...")
            
            # Inicializar handlers
            self.document_handler = DocumentHandler(
                app_settings=self.app_settings
            )
            
            if self.qdrant_client:
                self.qdrant_handler = QdrantHandler(
                    app_settings=self.app_settings,
                    qdrant_client=self.qdrant_client
                )
            
            # NUEVO: Inicializar embedding handler
            if self.embedding_client:
                from ..handler import EmbeddingHandler
                self.embedding_handler = EmbeddingHandler(
                    app_settings=self.app_settings,
                    embedding_client=self.embedding_client
                )
            
            self._logger.info("IngestionService inicializado correctamente")
            
        except Exception as e:
            self._logger.error(f"Error inicializando IngestionService: {e}")
            raise
    
    def set_websocket_manager(self, websocket_manager):
        """Configura el WebSocket manager."""
        self.websocket_manager = websocket_manager
        self._logger.info("WebSocket manager configurado")
    
    async def save_uploaded_file(self, file: UploadFile) -> Path:
        """Guarda archivo temporal para procesamiento."""
        temp_dir = Path(tempfile.gettempdir()) / "ingestion_uploads"
        temp_dir.mkdir(exist_ok=True)
        
        file_path = temp_dir / f"{uuid.uuid4()}_{file.filename}"
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return file_path
    
    async def _update_progress(
        self, 
        task: Dict[str, Any],
        status: IngestionStatus,
        message: str,
        percentage: float,
        error: Optional[str] = None
    ):
        """Actualiza progreso y notifica via WebSocket."""
        task["status"] = status
        task["message"] = message
        task["percentage"] = percentage
        if error:
            task["error"] = error
        
        # Guardar estado en Redis
        await self._save_task_state(task)
        
        # Notificar via WebSocket
        if self.websocket_manager:
            await self.websocket_manager.send_progress_update(
                task_id=str(task["task_id"]),
                status=status.value,
                message=message,
                percentage=percentage,
                total_chunks=task.get("total_chunks"),
                processed_chunks=task.get("processed_chunks"),
                error=error
            )
    
    async def _save_task_state(self, task: Dict[str, Any]):
        """Guarda estado en Redis con TTL."""
        try:
            await self.direct_redis_conn.setex(
                f"ingestion:task:{task['task_id']}",
                3600,  # 1 hora TTL
                json.dumps(task, default=str)
            )
        except Exception as e:
            self._logger.warning(f"Error guardando estado en Redis: {e}")
    
    async def get_task_status(
        self, 
        task_id: uuid.UUID, 
        user_id: uuid.UUID
    ) -> Optional[Dict[str, Any]]:
        """Recupera estado desde Redis."""
        try:
            # Primero intentar desde memoria
            if task_id in self._tasks:
                task = self._tasks[task_id]
                if task.get("user_id") == str(user_id):
                    return {
                        "task_id": str(task_id),
                        "status": task["status"].value if hasattr(task["status"], 'value') else task["status"],
                        "message": task.get("message", ""),
                        "percentage": task.get("percentage", 0),
                        "total_chunks": task.get("total_chunks", 0),
                        "processed_chunks": task.get("processed_chunks", 0),
                        "error": task.get("error")
                    }
            
            # Fallback a Redis
            task_data = await self.direct_redis_conn.get(f"ingestion:task:{task_id}")
            if task_data:
                task = json.loads(task_data)
                # Verificar que el usuario tiene acceso
                if task.get("user_id") == str(user_id):
                    return {
                        "task_id": str(task_id),
                        "status": task.get("status", "unknown"),
                        "message": task.get("message", ""),
                        "percentage": task.get("percentage", 0),
                        "total_chunks": task.get("total_chunks", 0),
                        "processed_chunks": task.get("processed_chunks", 0),
                        "error": task.get("error")
                    }
            
            return None
            
        except Exception as e:
            self._logger.error(f"Error obteniendo estado de tarea: {e}")
            return None

    async def ingest_document(
        self,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        request: DocumentIngestionRequest
    ) -> Dict[str, Any]:
        """
        Procesa la ingestion de un documento.
        
        CAMBIOS:
        - RAG config viene del request, no del agente
        - collection_id se genera si no viene
        - document_id siempre se genera aquí
        
        TODO: Implementar extracción real de tenant_id del JWT
        MVP: tenant_id = user_id (modo single-tenant)
        """
        # Generar IDs
        task_id = uuid.uuid4()
        document_id = uuid.uuid4()  # Siempre generado por el servicio
        
        # Generar collection_id si no viene
        if not request.collection_id:
            request.collection_id = f"col_{uuid.uuid4().hex[:8]}"
            logger.info(f"Generated collection_id: {request.collection_id}")
        
        # Usar RAG config del request o defaults
        rag_config = request.rag_config or RAGConfigRequest()
        
        # Normalizar agent_ids cuando llegan como cadena JSON (p.ej. "[]" o "[\"id\"]")
        try:
            if isinstance(request.agent_ids, list) and len(request.agent_ids) == 1 and isinstance(request.agent_ids[0], str):
                raw = request.agent_ids[0].strip()
                if raw in ("", "[]", "null", "None"):
                    request.agent_ids = []
                elif (raw.startswith("[") and raw.endswith("]")):
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        request.agent_ids = [str(x) for x in parsed if x]
        except Exception as _e:
            # Si falla el parseo, dejar agent_ids tal como vino y continuar
            pass
        
        # Validar consistencia del modelo en la collection
        await self._validate_collection_consistency(
            tenant_id=str(tenant_id),
            collection_id=request.collection_id,
            rag_config=rag_config
        )
        
        # Crear tarea
        task = {
            "task_id": task_id,
            "document_id": document_id,
            "tenant_id": str(tenant_id),
            "user_id": str(user_id),
            "collection_id": request.collection_id,
            "agent_ids": request.agent_ids,
            "status": IngestionStatus.PROCESSING,
            "request": request,
            "rag_config": rag_config,  # Guardar config usada
            "created_at": datetime.utcnow(),
            "total_chunks": 0,
            "processed_chunks": 0
        }
        
        # Guardar en memoria y Redis
        self._tasks[task_id] = task
        await self._save_task_state(task)
        
        # Iniciar procesamiento asíncrono
        asyncio.create_task(
            self._process_document_async(task)
        )
        
        return {
            "task_id": str(task_id),
            "document_id": str(document_id),
            "collection_id": request.collection_id,
            "agent_ids": request.agent_ids,
            "status": IngestionStatus.PROCESSING.value,
            "message": "Document ingestion started"
        }
    
    async def _validate_collection_consistency(
        self,
        tenant_id: str,
        collection_id: str,
        rag_config: RAGConfigRequest
    ):
        """Valida que todos los docs en una collection usen el mismo modelo."""
        try:
            # Consultar si ya hay documentos en esta collection
            def _select_existing():
                return (
                    self.supabase_client.client
                    .table("documents_rag")
                    .select("embedding_model, embedding_dimensions")
                    .eq("tenant_id", tenant_id)
                    .eq("collection_id", collection_id)
                    .limit(1)
                    .execute()
                )
            existing = await asyncio.to_thread(_select_existing)
             
            if existing.data:
                existing_model = existing.data[0]["embedding_model"]
                existing_dims = existing.data[0]["embedding_dimensions"]
                
                if (existing_model != rag_config.embedding_model or 
                    existing_dims != rag_config.embedding_dimensions):
                    raise ValueError(
                        f"Collection '{collection_id}' ya usa modelo '{existing_model}' "
                        f"con {existing_dims} dimensiones. No se pueden mezclar modelos."
                    )
            
        except Exception as e:
            if "No se pueden mezclar modelos" in str(e):
                raise
            self._logger.warning(f"Error validando collection: {e}")
    
    async def _process_document_async(self, task: Dict[str, Any]):
        """Procesa documento de forma asíncrona."""
        try:
            await self._update_progress(
                task,
                IngestionStatus.PROCESSING,
                "Procesando documento",
                10
            )
            
            # 1. Procesar documento en chunks
            chunks = await self.document_handler.process_document(
                task["request"],
                str(task["document_id"])
            )
            
            # Agregar IDs de jerarquía a cada chunk
            for chunk in chunks:
                chunk.tenant_id = task["tenant_id"]
                chunk.collection_id = task["collection_id"]
                chunk.agent_ids = task["agent_ids"]
            
            task["total_chunks"] = len(chunks)
            task["chunks"] = chunks
            
            await self._update_progress(
                task,
                IngestionStatus.CHUNKING,
                f"Creados {len(chunks)} chunks",
                30
            )
            
            # 2. Enviar para embeddings con RAG config del request
            await self._update_progress(
                task,
                IngestionStatus.EMBEDDING,
                "Generando embeddings",
                50
            )
            
            # Usar RAG config guardada en la task
            await self.embedding_handler.generate_embeddings(
                chunks=chunks,
                tenant_id=uuid.UUID(task["tenant_id"]),
                agent_ids=task["agent_ids"],
                task_id=task["task_id"],
                rag_config=task["rag_config"]  # Del request, no del agente
            )
            
        except Exception as e:
            self._logger.error(f"Error procesando documento: {e}")
            await self._update_progress(
                task,
                IngestionStatus.FAILED,
                "Error en procesamiento",
                0,
                error=str(e)
            )
    
    async def handle_embedding_callback(
        self,
        action: DomainAction
    ) -> Dict[str, Any]:
        """Maneja callback con embeddings del embedding service."""
        data = action.data
        task_id = uuid.UUID(data["task_id"])
        
        task = self._tasks.get(task_id)
        if not task:
            self._logger.error(f"Tarea no encontrada: {task_id}")
            return {"error": "Task not found"}
        
        try:
            # Actualizar chunks con embeddings
            chunk_embeddings = data["embeddings"]
            chunks = task.get("chunks", [])
            
            for i, chunk in enumerate(chunks):
                if i < len(chunk_embeddings):
                    chunk.embedding = chunk_embeddings[i]["embedding"]
            
            await self._update_progress(
                task,
                IngestionStatus.STORING,
                "Almacenando vectores",
                80
            )
            
            # Metadata de embedding desde el callback
            embedding_metadata = {
                "embedding_model": data.get("embedding_model"),
                "embedding_dimensions": data.get("embedding_dimensions"),
                "encoding_format": data.get("encoding_format", "float")
            }
            
            # Almacenar en Qdrant con jerarquía correcta
            result = await self.qdrant_handler.store_chunks(
                chunks=chunks,
                tenant_id=task["tenant_id"],
                collection_id=task["collection_id"],
                agent_ids=task["agent_ids"],
                embedding_metadata=embedding_metadata
            )
            
            task["processed_chunks"] = result["stored"]
            
            # Persistir metadata en Supabase
            await self._persist_document_metadata(task, embedding_metadata)
            
            # Completar tarea
            task["status"] = IngestionStatus.COMPLETED
            await self._update_progress(
                task,
                IngestionStatus.COMPLETED,
                "Ingestion completada",
                100
            )
            
            return {"status": "completed", "processed_chunks": result["stored"]}
            
        except Exception as e:
            self._logger.error(f"Error en callback: {e}")
            await self._update_progress(
                task,
                IngestionStatus.FAILED,
                "Error en procesamiento",
                80,
                error=str(e)
            )
            return {"error": str(e)}
    
    async def _persist_document_metadata(
        self,
        task: Dict[str, Any],
        embedding_metadata: Dict[str, Any]
    ):
        """Persiste metadata en tabla documents_rag."""
        try:
            # Mapear agent_ids a JSON array
            agent_ids_json = task["agent_ids"] if task["agent_ids"] else []
            
            document_data = {
                "profile_id": task["user_id"],  # Usuario que creó
                "tenant_id": task["tenant_id"],
                "collection_id": task["collection_id"],
                "document_id": str(task["document_id"]),
                "document_name": task["request"].document_name,
                "document_type": task["request"].document_type.value,
                
                # Crítico: metadata de embeddings
                "embedding_model": embedding_metadata["embedding_model"],
                "embedding_dimensions": embedding_metadata["embedding_dimensions"],
                "encoding_format": embedding_metadata.get("encoding_format", "float"),
                
                # Estado
                "status": "completed",
                "total_chunks": task["total_chunks"],
                "processed_chunks": task["processed_chunks"],
                
                # Metadata adicional incluyendo agent_ids
                "metadata": {
                    **task["request"].metadata,
                    "agent_ids": agent_ids_json  # Guardar en metadata JSON
                }
            }
            
            # Manejo temporal de agent_ids:
            # - Se almacena el primer agente en el campo "agent_id" para cumplir con la constraint NOT NULL.
            # - La lista completa de agentes se almacena en el campo "metadata.agent_ids" en formato JSON.
            # En futuras versiones, se planea migrar a solo usar el campo "metadata.agent_ids" para almacenar los agent_ids.
            # TODO: En v2, migrar a solo usar metadata JSON para agent_ids
            # Por ahora: agent_id (primer agente) + metadata.agent_ids (lista completa)
            # Si hay al menos un agent_id, usar el primero para cumplir NOT NULL
            if task["agent_ids"]:
                document_data["agent_id"] = task["agent_ids"][0]
            else:
                # Generar un UUID dummy para cumplir constraint
                document_data["agent_id"] = str(uuid.uuid4())
            
            def _insert_document():
                return (
                    self.supabase_client.client
                    .table("documents_rag")
                    .insert(document_data)
                    .execute()
                )
            response = await asyncio.to_thread(_insert_document)
            
            self._logger.info(
                f"Metadata persistida para documento {task['document_id']} "
                f"(model: {embedding_metadata['embedding_model']})"
            )
            
        except Exception as e:
            self._logger.error(f"Error persistiendo metadata: {e}")
    
    async def delete_document(
        self,
        tenant_id: uuid.UUID,
        document_id: uuid.UUID,
        collection_id: str
    ) -> Dict[str, Any]:
        """Elimina documento de Qdrant y Supabase."""
        try:
            # 1. Eliminar de Qdrant
            chunks_deleted = await self.qdrant_handler.delete_document(
                tenant_id=str(tenant_id),
                document_id=str(document_id),
                collection_id=collection_id
            )
            
            # 2. Eliminar de Supabase
            def _delete_document():
                return (
                    self.supabase_client.client
                    .table("documents_rag")
                    .delete()
                    .match({
                        "tenant_id": str(tenant_id),
                        "document_id": str(document_id),
                        "collection_id": collection_id
                    })
                    .execute()
                )
            await asyncio.to_thread(_delete_document)
            
            return {
                "message": "Document deleted successfully",
                "document_id": str(document_id),
                "chunks_deleted": chunks_deleted
            }
            
        except Exception as e:
            self._logger.error(f"Error eliminando documento: {e}")
            raise
    
    # NUEVO: Método para actualizar agentes de un documento
    async def update_document_agents(
        self,
        tenant_id: uuid.UUID,
        document_id: uuid.UUID,
        agent_ids: List[str],
        operation: str = "set"
    ) -> Dict[str, Any]:
        """Actualiza los agentes con acceso a un documento."""
        try:
            # 1. Actualizar en Qdrant
            success = await self.qdrant_handler.update_chunk_agents(
                tenant_id=str(tenant_id),
                document_id=str(document_id),
                agent_ids=agent_ids,
                operation=operation
            )
            
            if not success:
                raise ValueError("Failed to update agents in Qdrant")
            
            # 2. Actualizar en Supabase (metadata JSON)
            def _select_doc():
                return (
                    self.supabase_client.client
                    .table("documents_rag")
                    .select("metadata")
                    .match({
                        "tenant_id": str(tenant_id),
                        "document_id": str(document_id)
                    })
                    .single()
                    .execute()
                )
            current_doc = await asyncio.to_thread(_select_doc)
            
            if current_doc.data:
                metadata = current_doc.data["metadata"] or {}
                current_agents = metadata.get("agent_ids", [])
                
                if operation == "set":
                    metadata["agent_ids"] = agent_ids
                elif operation == "add":
                    metadata["agent_ids"] = list(set(current_agents + agent_ids))
                elif operation == "remove":
                    metadata["agent_ids"] = [a for a in current_agents if a not in agent_ids]
                
                def _update_doc():
                    return (
                        self.supabase_client.client
                        .table("documents_rag")
                        .update({
                            "metadata": metadata,
                            "agent_id": agent_ids[0] if agent_ids else str(uuid.uuid4())
                        })
                        .match({
                            "tenant_id": str(tenant_id),
                            "document_id": str(document_id)
                        })
                        .execute()
                    )
                await asyncio.to_thread(_update_doc)
            
            return {
                "success": True,
                "document_id": str(document_id),
                "agent_ids": agent_ids,
                "operation": operation
            }
            
        except Exception as e:
            self._logger.error(f"Error actualizando agentes: {e}")
            raise