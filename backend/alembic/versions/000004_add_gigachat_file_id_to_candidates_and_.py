"""Add gigachat_file_id to candidates and vacancies

Revision ID: 000004
Revises: 000003
Create Date: 2025-09-06 16:39:52.660708

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "000004"
down_revision: Union[str, None] = "000003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add gigachat_file_id column to candidates table
    op.add_column(
        "candidate", sa.Column("gigachat_file_id", sa.String(255), nullable=True)
    )

    # Add gigachat_file_id column to vacancy table
    op.add_column(
        "vacancy", sa.Column("gigachat_file_id", sa.String(255), nullable=True)
    )


def downgrade() -> None:
    # Remove gigachat_file_id column from vacancy table
    op.drop_column("vacancy", "gigachat_file_id")

    # Remove gigachat_file_id column from candidates table
    op.drop_column("candidate", "gigachat_file_id")
