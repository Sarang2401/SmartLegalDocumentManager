from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    APP_NAME: str = "Smart Legal Document Manager"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/legal_doc_manager"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
