"""
Configuración para Orchestrator Service.
Extiende CommonAppSettings con configuraciones específicas.
"""
from typing import Optional
from pydantic import Field

from common.config.base_settings import CommonAppSettings


class OrchestratorSettings(CommonAppSettings):
    """Configuración específica para Orchestrator Service."""
    
    # Service identification (override)
    service_name: str = Field(default="orchestrator-service")
    service_version: str = Field(default="2.0.0")
    
    # API Settings
    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8001)
    
    # Supabase configuration
    supabase_url: str = Field(..., description="URL de Supabase")
    supabase_anon_key: str = Field(..., description="Clave anónima de Supabase")
    supabase_service_key: Optional[str] = Field(None, description="Clave de servicio de Supabase")
    
    # Cache configuration
    config_cache_ttl: int = Field(default=600, description="TTL para cache de configuraciones (segundos)")
    session_cache_ttl: int = Field(default=1800, description="TTL para cache de sesiones (segundos)")
    
    # WebSocket configuration
    websocket_ping_interval: int = Field(default=30, description="Intervalo de ping WebSocket (segundos)")
    websocket_ping_timeout: int = Field(default=10, description="Timeout de ping WebSocket (segundos)")
    max_websocket_connections: int = Field(default=10000, description="Máximo de conexiones WebSocket")
    websocket_base_url: Optional[str] = Field(None, description="URL base para WebSocket (si difiere de API)")
    
    # Rate limiting
    public_chat_rate_limit: int = Field(default=60, description="Rate limit para chat público (req/min)")
    
    # Timeouts
    execution_timeout: int = Field(default=120, description="Timeout para execution service (segundos)")
    query_timeout: int = Field(default=30, description="Timeout para queries (segundos)")
    
    # Session management
    session_cleanup_interval: int = Field(default=300, description="Intervalo de limpieza de sesiones (segundos)")
    session_max_idle_time: int = Field(default=1800, description="Tiempo máximo de inactividad de sesión (segundos)")
    
    # Worker configuration for callback processing
    callback_worker_enabled: bool = Field(default=True, description="Habilitar worker de callbacks")
    callback_worker_count: int = Field(default=1, description="Número de workers de callback")
    
    class Config:
        env_prefix = "ORCHESTRATOR_"
        case_sensitive = False