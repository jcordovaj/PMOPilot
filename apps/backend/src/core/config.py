from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Configuración de la aplicación usando Pydantic Settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # Configuración AWS y DynamoDB
    aws_access_key_id: str = Field(default="fakeMyKeyId", description="AWS Access Key ID")
    aws_secret_access_key: str = Field(default="fakeSecretAccessKey", description="AWS Secret Access Key")
    aws_region: str = Field(default="us-east-1", description="AWS Region")
    dynamodb_endpoint: Optional[str] = Field(default=None, description="DynamoDB endpoint (local)")
    dynamodb_table_prefix: str = Field(default="pmopilot_", description="Prefijo para tablas DynamoDB")
    
    # Configuración Google Gemini
    gemini_api_key: str = Field(default="", description="API Key para Google Gemini")
    gemini_model: str = Field(default="gemini-2.5-flash", description="Modelo de Gemini a usar")
    
    # Configuración SendGrid
    sendgrid_api_key: str = Field(default="", description="API Key para SendGrid")
    sendgrid_from_email: str = Field(default="noreply@pmopilot.dev", description="Email remitente SendGrid")
    
    # Configuración Cloudflare
    cloudflare_api_token: str = Field(default="", description="API Token para Cloudflare")
    cloudflare_zone_id: str = Field(default="", description="Zone ID de Cloudflare")
    cloudflare_account_id: str = Field(default="", description="Account ID de Cloudflare")
    
    # Configuración de la aplicación
    app_environment: str = Field(default="development", description="Entorno: development, staging, production")
    app_name: str = Field(default="PMOPilot", description="Nombre de la aplicación")
    app_version: str = Field(default="0.1.0", description="Versión de la aplicación")
    api_prefix: str = Field(default="/api", description="Prefijo para las APIs")
    backend_port: int = Field(default=8000, description="Puerto del backend")
    frontend_port: int = Field(default=3000, description="Puerto del frontend")
    cors_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:8000"], description="Orígenes permitidos para CORS")
    
    # Configuración de seguridad
    jwt_secret_key: str = Field(default="your-super-secret-jwt-key-change-this-in-production", description="Clave secreta para JWT")
    jwt_algorithm: str = Field(default="HS256", description="Algoritmo para JWT")
    jwt_access_token_expire_minutes: int = Field(default=30, description="Tiempo de expiración del token JWT")
    
    # Configuración de roles RBAC
    default_user_role: str = Field(default="guest", description="Rol por defecto para usuarios")
    allowed_roles: List[str] = Field(default=["leader", "tester", "guest"], description="Roles permitidos en el sistema")
    
    @property
    def dynamodb_table_name(self) -> str:
        """Nombre completo de la tabla DynamoDB."""
        return f"{self.dynamodb_table_prefix}main"
    
    @property
    def is_local_dynamodb(self) -> bool:
        """Indica si estamos usando DynamoDB local."""
        return self.dynamodb_endpoint is not None
    
    @property
    def is_production(self) -> bool:
        """Indica si estamos en entorno de producción."""
        return self.app_environment == "production"
    
    @property
    def gemini_configured(self) -> bool:
        """Indica si Gemini está configurado."""
        return bool(self.gemini_api_key) and self.gemini_api_key != "YOUR_GEMINI_API_KEY"
    
    @property
    def sendgrid_configured(self) -> bool:
        """Indica si SendGrid está configurado."""
        return bool(self.sendgrid_api_key) and self.sendgrid_api_key != "YOUR_SENDGRID_API_KEY"
    
    @property
    def cloudflare_configured(self) -> bool:
        """Indica si Cloudflare está configurado."""
        return bool(self.cloudflare_api_token) and self.cloudflare_api_token != "YOUR_CLOUDFLARE_API_TOKEN"


# Instancia global de configuración
settings = Settings()