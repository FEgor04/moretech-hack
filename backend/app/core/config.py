from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI HR Backend"
    database_url: str = "postgresql+asyncpg://aihr:aihr@localhost:5432/aihr"
    auth_secret: str = "devsecret"
    default_user_email: str = "admin@example.com"
    default_user_password: str = "admin"
    default_user_name: str = "Admin"
    gigachat_credentials: str = "devsecret"

    class Config:
        env_file = ".env"
        env_prefix = ""


settings = Settings()
