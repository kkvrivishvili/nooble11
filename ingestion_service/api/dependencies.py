"""
Dependencias corregidas para las rutas API.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..services.ingestion_service import IngestionService
from ..websocket.ingestion_websocket_manager import IngestionWebSocketManager
from ..config.settings import IngestionSettings
from common.supabase.client import SupabaseClient

# Security
security = HTTPBearer()

# Instancias globales
_ingestion_service: Optional[IngestionService] = None
_websocket_manager: Optional[IngestionWebSocketManager] = None
_settings: Optional[IngestionSettings] = None
_supabase_client: Optional[SupabaseClient] = None


def set_dependencies(
    ingestion_service: IngestionService,
    websocket_manager: IngestionWebSocketManager,
    settings: IngestionSettings,
    supabase_client: SupabaseClient
):
    """Configura las dependencias globales."""
    global _ingestion_service, _websocket_manager, _settings, _supabase_client
    
    _ingestion_service = ingestion_service
    _websocket_manager = websocket_manager
    _settings = settings
    _supabase_client = supabase_client


async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Verifica token JWT con Supabase.
    
    NOTA: Por ahora retorna info básica.
    TODO: Implementar verificación real y extraer tenant_id del token.
    """
    if not _supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    try:
        # Verificar token con Supabase
        user_info = await _supabase_client.verify_jwt_token(credentials.credentials)
        
        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Construir respuesta con info del usuario
        # TODO: Agregar tenant_id y agent_ids al token JWT
        auth_data = {
            "user_id": user_info.id,
            "email": user_info.email,
            "user_metadata": user_info.user_metadata or {},
            "app_metadata": user_info.app_metadata or {},
            "raw_token": credentials.credentials  # Para operaciones con RLS
        }
        
        # Si no hay tenant_id en app_metadata, consultar de profiles
        if not auth_data["app_metadata"].get("tenant_id"):
            # Por ahora usar user_id como tenant_id
            # TODO: Implementar consulta real a profiles table
            auth_data["app_metadata"]["tenant_id"] = user_info.id
        
        return auth_data
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


def get_ingestion_service() -> IngestionService:
    """Obtiene el servicio de ingestion."""
    if not _ingestion_service:
        raise HTTPException(status_code=500, detail="IngestionService not initialized")
    return _ingestion_service


def get_websocket_manager() -> IngestionWebSocketManager:
    """Obtiene el WebSocket manager."""
    if not _websocket_manager:
        raise HTTPException(status_code=500, detail="WebSocketManager not initialized")
    return _websocket_manager


def get_settings() -> IngestionSettings:
    """Obtiene la configuración."""
    if not _settings:
        raise HTTPException(status_code=500, detail="Settings not initialized")
    return _settings


def get_supabase_client() -> SupabaseClient:
    """Obtiene el cliente de Supabase."""
    if not _supabase_client:
        raise HTTPException(status_code=500, detail="SupabaseClient not initialized")
    return _supabase_client