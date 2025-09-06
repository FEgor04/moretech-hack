"""update candidate model

Revision ID: 20250109_01
Revises: 20240904_01
Create Date: 2025-01-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20250109_01"
down_revision: Union[str, None] = "20240904_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    if inspector.has_table("candidate"):
        # Remove user_id foreign key and column
        op.drop_constraint("candidate_user_id_fkey", "candidate", type_="foreignkey")
        op.drop_column("candidate", "user_id")

        # Remove old columns
        op.drop_column("candidate", "resume_url")
        op.drop_column("candidate", "notes")

        # Add new columns
        op.add_column(
            "candidate",
            sa.Column(
                "position", sa.String(length=255), nullable=False, server_default=""
            ),
        )
        op.add_column(
            "candidate",
            sa.Column("experience", sa.Integer(), nullable=False, server_default="0"),
        )

        # Update status column default value
        op.alter_column(
            "candidate",
            "status",
            existing_type=sa.String(length=64),
            server_default="pending",
            nullable=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    if inspector.has_table("candidate"):
        # Remove new columns
        op.drop_column("candidate", "position")
        op.drop_column("candidate", "experience")

        # Add back old columns
        op.add_column(
            "candidate", sa.Column("resume_url", sa.String(length=1024), nullable=True)
        )
        op.add_column("candidate", sa.Column("notes", sa.Text(), nullable=True))
        op.add_column(
            "candidate",
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=True),
        )

        # Restore old status default
        op.alter_column(
            "candidate",
            "status",
            existing_type=sa.String(length=64),
            server_default="ждем ответа",
            nullable=False,
        )
