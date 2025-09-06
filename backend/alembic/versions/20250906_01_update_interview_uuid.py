"""switch interview.id to uuid string

Revision ID: 20250906_01
Revises: 20250109_01
Create Date: 2025-09-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20250906_01"
down_revision: Union[str, None] = "20250109_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    if inspector.has_table("interview"):
        interview_columns = {
            col["name"]: col for col in inspector.get_columns("interview")
        }

        # Convert interview.id to VARCHAR(36) if currently integer
        id_type = interview_columns.get("id", {}).get("type")
        if id_type is not None and isinstance(id_type, sa.Integer):
            # Drop server default (sequence) if present, then alter type
            op.alter_column(
                "interview",
                "id",
                existing_type=sa.Integer(),
                type_=sa.String(length=36),
                server_default=None,
                postgresql_using="id::text",
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    if inspector.has_table("interview"):
        interview_columns = {
            col["name"]: col for col in inspector.get_columns("interview")
        }

        id_type = interview_columns.get("id", {}).get("type")
        if id_type is not None and isinstance(id_type, sa.String):
            # Attempt to convert back to integer (will fail if non-numeric values exist)
            op.alter_column(
                "interview",
                "id",
                existing_type=sa.String(length=36),
                type_=sa.Integer(),
                postgresql_using="id::integer",
            )
