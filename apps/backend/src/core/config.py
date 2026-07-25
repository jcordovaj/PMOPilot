import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Settings
    PORT: int = 8000
    NODE_ENV: str = "development"

    # API Keys & Third-party integrations
    GEMINI_API_KEY: str = "MY_GEMINI_API_KEY"
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_SENDER_EMAIL: str = "no-reply@pmopilot.com"
    CLOUDFLARE_ZONE_ID: Optional[str] = None
    CLOUDFLARE_API_TOKEN: Optional[str] = None

    # AWS DynamoDB config
    DYNAMODB_ENDPOINT: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = "fakeAccessKeyId"
    AWS_SECRET_ACCESS_KEY: str = "fakeSecretAccessKey"
    DYNAMODB_TABLE_PREFIX: str = "pmopilot-dev-"

    # Git Integrations
    GITHUB_TOKEN: Optional[str] = None
    GITHUB_WEBHOOK_SECRET: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
