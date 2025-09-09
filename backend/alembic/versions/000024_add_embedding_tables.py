"""Add embedding tables with pgvector support

Revision ID: 000024
Revises: 000023
Create Date: 2024-01-09 12:00:00.000000

"""

from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = "000024"
down_revision = "000023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if vector extension is available by querying pg_extension
    connection = op.get_bind()
    result = connection.execute(
        text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
    ).fetchone()

    if result:
        # Vector extension is available, use vector columns
        use_vector = True
    else:
        # Vector extension is not available, use TEXT columns
        use_vector = False

    if use_vector:
        # Create candidate_embeddings table with vector column
        op.execute(
            """
            CREATE TABLE candidate_embeddings (
                id VARCHAR(36) NOT NULL,
                candidate_id VARCHAR(36) NOT NULL,
                embedding vector(1024) NOT NULL,
                text_content VARCHAR(10000) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id),
                UNIQUE (candidate_id),
                FOREIGN KEY (candidate_id) REFERENCES candidate(id) ON DELETE CASCADE
            )
        """
        )

        # Create vacancy_embeddings table with vector column
        op.execute(
            """
            CREATE TABLE vacancy_embeddings (
                id VARCHAR(36) NOT NULL,
                vacancy_id INTEGER NOT NULL,
                embedding vector(1024) NOT NULL,
                text_content VARCHAR(10000) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id),
                UNIQUE (vacancy_id),
                FOREIGN KEY (vacancy_id) REFERENCES vacancy(id) ON DELETE CASCADE
            )
        """
        )
    else:
        # Create candidate_embeddings table with TEXT column for test environments
        op.execute(
            """
            CREATE TABLE candidate_embeddings (
                id VARCHAR(36) NOT NULL,
                candidate_id VARCHAR(36) NOT NULL,
                embedding TEXT NOT NULL,
                text_content VARCHAR(10000) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id),
                UNIQUE (candidate_id),
                FOREIGN KEY (candidate_id) REFERENCES candidate(id) ON DELETE CASCADE
            )
        """
        )

        # Create vacancy_embeddings table with TEXT column for test environments
        op.execute(
            """
            CREATE TABLE vacancy_embeddings (
                id VARCHAR(36) NOT NULL,
                vacancy_id INTEGER NOT NULL,
                embedding TEXT NOT NULL,
                text_content VARCHAR(10000) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id),
                UNIQUE (vacancy_id),
                FOREIGN KEY (vacancy_id) REFERENCES vacancy(id) ON DELETE CASCADE
            )
        """
        )

    # Create indexes for better performance
    op.execute(
        "CREATE INDEX ix_candidate_embeddings_candidate_id ON candidate_embeddings (candidate_id)"
    )
    op.execute(
        "CREATE INDEX ix_vacancy_embeddings_vacancy_id ON vacancy_embeddings (vacancy_id)"
    )


def downgrade() -> None:
    # Drop indexes
    op.execute("DROP INDEX IF EXISTS ix_vacancy_embeddings_vacancy_id")
    op.execute("DROP INDEX IF EXISTS ix_candidate_embeddings_candidate_id")

    # Drop tables
    op.execute("DROP TABLE IF EXISTS vacancy_embeddings")
    op.execute("DROP TABLE IF EXISTS candidate_embeddings")

    # Note: We don't drop the vector extension as it might be used by other applications
