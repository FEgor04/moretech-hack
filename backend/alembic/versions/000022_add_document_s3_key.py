"""add document_s3_key to candidate and vacancy

Revision ID: 000022
Revises: 000021
Create Date: 2025-09-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "000022"
down_revision: Union[str, None] = "000021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    def column_exists(table: str, column: str) -> bool:
        return bool(
            bind.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = :t AND column_name = :c
                    """
                ),
                {"t": table, "c": column},
            ).scalar()
        )

    # Candidate
    with op.batch_alter_table("candidate") as batch_op:
        if not column_exists("candidate", "document_s3_key"):
            batch_op.add_column(
                sa.Column("document_s3_key", sa.String(length=512), nullable=True)
            )

    # Vacancy
    with op.batch_alter_table("vacancy") as batch_op:
        if not column_exists("vacancy", "document_s3_key"):
            batch_op.add_column(
                sa.Column("document_s3_key", sa.String(length=512), nullable=True)
            )


def downgrade() -> None:
    with op.batch_alter_table("vacancy") as batch_op:
        batch_op.drop_column("document_s3_key")

    with op.batch_alter_table("candidate") as batch_op:
        batch_op.drop_column("document_s3_key")
