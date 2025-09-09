import asyncio
import os
from collections.abc import AsyncGenerator

import pytest
from app.core.config import settings
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from testcontainers.postgres import PostgresContainer
from testcontainers.minio import MinioContainer

# Set default environment variables
os.environ.setdefault("DEFAULT_USER_EMAIL", "admin@example.com")
os.environ.setdefault("DEFAULT_USER_PASSWORD", "admin")
os.environ.setdefault("DEFAULT_USER_NAME", "Admin")


@pytest.fixture(scope="session")
def postgres_container():
    """Start PostgreSQL container for the entire test session."""
    with PostgresContainer("postgres:15") as postgres:
        # Get connection details and construct asyncpg URL
        host = postgres.get_container_host_ip()
        port = postgres.get_exposed_port(5432)
        database = postgres.dbname
        user = postgres.username
        password = postgres.password

        # Set the database URL environment variable for the test session
        database_url = (
            f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}"
        )
        os.environ["DATABASE_URL"] = database_url

        # Reload pydantic settings
        settings.__init__()

        # Import modules after setting the database URL
        from alembic import command
        from alembic.config import Config

        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")

        yield postgres


@pytest.fixture(scope="session")
def minio_container():
    """Start MinIO container and configure S3 env for the entire test session."""
    # Configure creds and bucket
    access_key = "minioadmin"
    secret_key = "minioadmin"
    bucket_name = "test-bucket"

    with MinioContainer() as container:
        host = container.get_container_host_ip()
        port = container.get_exposed_port(9000)
        endpoint = f"http://{host}:{port}"

        # Set S3 env vars for app settings
        os.environ["S3_ENDPOINT_URL"] = endpoint
        os.environ["S3_REGION"] = "us-east-1"
        os.environ["S3_ACCESS_KEY_ID"] = access_key
        os.environ["S3_SECRET_ACCESS_KEY"] = secret_key
        os.environ["S3_BUCKET_NAME"] = bucket_name

        # Reload pydantic settings to pick up S3 env
        settings.__init__()

        # Create bucket
        from app.clients.s3 import get_s3_client

        s3 = get_s3_client()
        try:
            s3.create_bucket(Bucket=bucket_name)
        except Exception:
            # Bucket may already exist in rare cases
            pass

        yield {
            "endpoint": endpoint,
            "bucket": bucket_name,
            "access_key": access_key,
            "secret_key": secret_key,
        }


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture()
async def db_session(
    postgres_container, minio_container
) -> AsyncGenerator[AsyncSession, None]:
    """Create database session with container."""
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture()
async def client(
    postgres_container, minio_container
) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database container."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
