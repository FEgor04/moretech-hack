from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI HR Backend"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    auth_secret: str = "devsecret"
    default_user_email: str = "admin@example.com"
    default_user_password: str = "admin"
    default_user_name: str = "Admin"
    gigachat_credentials: str = ""
    yandex_speech_key: str = ""
    use_yandex_speech_synthesis: bool = False

    s3_endpoint_url: str = "https://s3.cloud.ru"
    s3_region: str = "ru-central-1"
    s3_tenant_id: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket_name: str = "moretech-dev"

    class Config:
        env_file = ".env"
        env_prefix = ""


settings = Settings()
