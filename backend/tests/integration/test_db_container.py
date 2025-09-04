import os

import pytest
from testcontainers.postgres import PostgresContainer


@pytest.mark.integration
def test_postgres_container_starts():
    with PostgresContainer("postgres:16") as pg:
        url = pg.get_connection_url()
        assert url.startswith("postgresql://") or url.startswith(
            "postgresql+psycopg2://"
        )
        os.environ["DATABASE_URL"] = url.replace(
            "postgresql://", "postgresql+asyncpg://"
        )
