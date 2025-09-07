"""cv experience years and education list, drop positions

Revision ID: 000012
Revises: 000010
Create Date: 2025-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect, text


revision: str = "000012"
down_revision: Union[str, None] = "000010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

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

    # Drop positions column from candidate if present
    if inspector.has_table("candidate") and column_exists("candidate", "positions"):
        with op.batch_alter_table("candidate") as batch_op:
            batch_op.drop_column("positions")


def downgrade() -> None:
    # Can't recover data for positions; add column back for compatibility
    with op.batch_alter_table("candidate") as batch_op:
        batch_op.add_column(sa.Column("positions", sa.Text(), nullable=True))
