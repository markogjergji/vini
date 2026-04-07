from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./vini.db"
    upload_dir: str = "app/uploads"
    cors_origins: list[str] = ["http://localhost:5173"]

    # JWT
    secret_key: str = "changeme-super-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    model_config = {"env_file": ".env"}


settings = Settings()
