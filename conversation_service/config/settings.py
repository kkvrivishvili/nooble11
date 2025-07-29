"""
Configuración para Conversation Service.
"""
from typing import Optional
from pydantic import Field
from common.config import CommonAppSettings


class ConversationSettings(CommonAppSettings):
    """Configuración específica para Conversation Service."""
    
    # Base
    service_name: str = Field(default="conversation_service", description="Nombre del servicio")
    service_version: str = Field(default="2.0.0", description="Versión del servicio")
    
    # Supabase
    supabase_url: str = Field(..., description="URL de Supabase", env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., description="Clave anónima de Supabase", env="SUPABASE_ANON_KEY")
    supabase_service_key: Optional[str] = Field(None, description="Clave de servicio", env="SUPABASE_SERVICE_KEY")
    
    # Workers
    worker_count: int = Field(default=2, description="Número de workers")
    worker_sleep_seconds: float = Field(default=0.1, description="Tiempo entre polls")
    
    class Config:
        env_file = ".env"
        case_sensitive = False