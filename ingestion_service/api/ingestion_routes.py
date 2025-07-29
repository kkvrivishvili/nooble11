"""
Rutas API corregidas para ingestion.
"""
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request, Body

from ..models import (
    DocumentIngestionRequest,
    IngestionResponse,
    IngestionStatus,
    RAGConfigRequest
)
from ..services.ingestion_service import IngestionService
from ..config.settings import IngestionSettings
from .dependencies import (
    verify_jwt_token,
    get_ingestion_service,
    get_websocket_manager,
    get_settings
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/ingest")
async def ingest_document(
    request: DocumentIngestionRequest,
    http_request: Request,
    user_auth: Dict[str, Any] = Depends(verify_jwt_token),
    ingestion_service: IngestionService = Depends(get_ingestion_service)
) -> IngestionResponse:
    """
    Ingesta un documento con configuración RAG flexible.
    
    - RAG config viene en el request (opcional, tiene defaults)
    - collection_id opcional (se genera si no viene)
    - agent_ids opcional (lista vacía por defecto)
    - document_id siempre generado por el servicio
    """
    try:
        # Extraer tenant_id del JWT
        # Por ahora usamos user_id como tenant_id hasta resolver JWT
        tenant_id = user_auth.get("app_metadata", {}).get("tenant_id")
        if not tenant_id:
            # Fallback: usar user_id como tenant_id temporalmente
            tenant_id = user_auth["user_id"]
            logger.warning(f"No tenant_id in JWT, using user_id: {tenant_id}")
        
        logger.info(
            f"Iniciando ingestion: collection={request.collection_id}, "
            f"agents={request.agent_ids}, tenant={tenant_id}"
        )
        
        # Procesar ingestion
        result = await ingestion_service.ingest_document(
            tenant_id=uuid.UUID(tenant_id),
            user_id=uuid.UUID(user_auth["user_id"]),
            request=request
        )
        
        # Construir URL de WebSocket
        ws_protocol = "wss" if http_request.url.scheme == "https" else "ws"
        websocket_url = f"{ws_protocol}://{http_request.url.hostname}"
        if http_request.url.port:
            websocket_url += f":{http_request.url.port}"
        websocket_url += f"/ws/ingestion/{result['task_id']}"
        
        return IngestionResponse(
            task_id=result["task_id"],
            document_id=result["document_id"],
            collection_id=result["collection_id"],
            agent_ids=result["agent_ids"],
            status=IngestionStatus.PROCESSING,
            message=result["message"],
            websocket_url=websocket_url
        )
        
    except ValueError as e:
        # Errores de validación (ej: modelos inconsistentes)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error en ingestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-ingest")
async def batch_ingest_documents(
    documents: List[DocumentIngestionRequest],
    collection_id: Optional[str] = Body(None),
    agent_ids: Optional[List[str]] = Body(default_factory=list),
    default_rag_config: Optional[RAGConfigRequest] = Body(None),
    user_auth: Dict[str, Any] = Depends(verify_jwt_token),
    ingestion_service: IngestionService = Depends(get_ingestion_service)
) -> Dict[str, Any]:
    """
    Ingesta múltiples documentos en lote.
    
    - Si collection_id se provee, todos los docs van a esa collection
    - Si agent_ids se provee, se aplica a todos los docs
    - default_rag_config se usa si un doc no tiene su propia config
    """
    try:
        tenant_id = user_auth.get("app_metadata", {}).get("tenant_id")
        if not tenant_id:
            tenant_id = user_auth["user_id"]
        
        # Si no hay collection_id, generar uno para todo el batch
        batch_collection_id = collection_id or f"batch_{uuid.uuid4().hex[:8]}"
        
        results = []
        errors = []
        
        for idx, doc_request in enumerate(documents):
            try:
                # Aplicar defaults del batch
                if not doc_request.rag_config and default_rag_config:
                    doc_request.rag_config = default_rag_config
                
                # Usar collection del batch si el doc no tiene
                if not doc_request.collection_id:
                    doc_request.collection_id = batch_collection_id
                
                # Aplicar agent_ids del batch si el doc no tiene
                if agent_ids and not doc_request.agent_ids:
                    doc_request.agent_ids = agent_ids
                
                # Procesar documento
                result = await ingestion_service.ingest_document(
                    tenant_id=uuid.UUID(tenant_id),
                    user_id=uuid.UUID(user_auth["user_id"]),
                    request=doc_request
                )
                
                results.append({
                    "index": idx,
                    "document_name": doc_request.document_name,
                    **result
                })
                
            except Exception as e:
                logger.error(f"Error procesando documento {idx}: {e}")
                errors.append({
                    "index": idx,
                    "document_name": doc_request.document_name,
                    "error": str(e)
                })
        
        return {
            "batch_id": str(uuid.uuid4()),
            "collection_id": batch_collection_id,
            "total_documents": len(documents),
            "succeeded": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error en batch ingestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_and_ingest(
    file: UploadFile = File(...),
    collection_id: Optional[str] = Body(None),
    agent_ids: Optional[List[str]] = Body(default_factory=list),
    embedding_model: str = Body(default="text-embedding-3-small"),
    chunk_size: int = Body(default=512),
    chunk_overlap: int = Body(default=50),
    user_auth: Dict[str, Any] = Depends(verify_jwt_token),
    ingestion_service: IngestionService = Depends(get_ingestion_service),
    settings: IngestionSettings = Depends(get_settings)
) -> IngestionResponse:
    """Upload y procesa un archivo."""
    try:
        # Validar tamaño
        if file.size > settings.max_file_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {settings.max_file_size_mb}MB"
            )
        
        # Validar tipo
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['pdf', 'docx', 'txt', 'md']:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type"
            )
        
        # Guardar archivo temporalmente
        temp_path = await ingestion_service.save_uploaded_file(file)
        
        # Crear RAG config
        rag_config = RAGConfigRequest(
            embedding_model=embedding_model,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        # Crear request de ingestion
        request = DocumentIngestionRequest(
            document_name=file.filename,
            document_type=file_extension,
            file_path=str(temp_path),
            collection_id=collection_id,
            agent_ids=agent_ids or [],
            rag_config=rag_config
        )
        
        # Delegar a ingest_document
        return await ingest_document(
            request=request,
            http_request=Request,
            user_auth=user_auth,
            ingestion_service=ingestion_service
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/document/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    collection_id: str = Body(..., description="Collection ID del documento"),
    user_auth: Dict[str, Any] = Depends(verify_jwt_token),
    ingestion_service: IngestionService = Depends(get_ingestion_service)
) -> Dict[str, Any]:
    """
    Elimina un documento y sus chunks.
    Requiere collection_id para validación.
    """
    try:
        tenant_id = user_auth.get("app_metadata", {}).get("tenant_id")
        if not tenant_id:
            tenant_id = user_auth["user_id"]
        
        result = await ingestion_service.delete_document(
            tenant_id=uuid.UUID(tenant_id),
            document_id=document_id,
            collection_id=collection_id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error eliminando documento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/document/{document_id}/agents")
async def update_document_agents(
    document_id: uuid.UUID,
    agent_ids: List[str] = Body(..., description="Lista de agent IDs"),
    operation: str = Body(default="set", description="Operación: set, add, remove"),
    user_auth: Dict[str, Any] = Depends(verify_jwt_token),
    ingestion_service: IngestionService = Depends(get_ingestion_service)
) -> Dict[str, Any]:
    """
    Actualiza los agentes con acceso a un documento.
    
    Operaciones:
    - set: Reemplaza la lista completa
    - add: Agrega agentes a la lista existente
    - remove: Elimina agentes de la lista
    """
    try:
        if operation not in ["set", "add", "remove"]:
            raise HTTPException(
                status_code=400,
                detail="Operation must be: set, add, or remove"
            )
        
        tenant_id = user_auth.get("app_metadata", {}).get("tenant_id")
        if not tenant_id:
            tenant_id = user_auth["user_id"]
        
        result = await ingestion_service.update_document_agents(
            tenant_id=uuid.UUID(tenant_id),
            document_id=document_id,
            agent_ids=agent_ids,
            operation=operation
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando agentes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}")
async def get_ingestion_status(
    task_id: uuid.UUID,
    user_auth: Dict[str, Any] = Depends(verify_jwt_token),
    ingestion_service: IngestionService = Depends(get_ingestion_service)
) -> Dict[str, Any]:
    """Obtiene el estado de una tarea de ingestion."""
    try:
        status = await ingestion_service.get_task_status(
            task_id, 
            uuid.UUID(user_auth["user_id"])
        )
        
        if not status:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo estado: {e}")
        raise HTTPException(status_code=500, detail=str(e))