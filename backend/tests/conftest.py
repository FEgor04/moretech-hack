import asyncio
import os
from collections.abc import AsyncGenerator

import pytest
import sqlalchemy as sa
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure database configuration before importing the app
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://aihr:aihr@localhost:5432/aihr"
)
os.environ.setdefault("DEFAULT_USER_EMAIL", "admin@example.com")
os.environ.setdefault("DEFAULT_USER_PASSWORD", "admin")
os.environ.setdefault("DEFAULT_USER_NAME", "Admin")

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from app.db.session import AsyncSessionLocal  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _migrate_db():
    # Wait for docker-compose postgres if running
    import socket
    import time

    host = "localhost"
    port = 5432
    for _ in range(60):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            try:
                s.connect((host, port))
                break
            except OSError:
                time.sleep(1)
    # run migrations once, synchronously (no running event loop here)
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


@pytest.fixture(autouse=True)
async def _clean_db() -> None:
    # Ensure tests are isolated: wipe data but keep default admin user
    async with AsyncSessionLocal() as session:
        await session.execute(sa.text("DELETE FROM interview"))
        await session.execute(sa.text("DELETE FROM candidate"))
        await session.execute(sa.text("DELETE FROM vacancy"))
        await session.execute(
            sa.text('DELETE FROM "user" WHERE email != :email'),
            {"email": os.environ.get("DEFAULT_USER_EMAIL", "admin@example.com")},
        )
        await session.commit()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop


@pytest.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture()
async def client() -> AsyncGenerator[AsyncClient, None]:
    # DB is migrated in session-scoped fixture above
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
