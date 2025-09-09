"""increase employment_type column length

Revision ID: 000015
Revises: 000012
Create Date: 2025-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "000015"
down_revision: Union[str, None] = "000012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Increase employment_type column length from 64 to 255
    with op.batch_alter_table("candidate") as batch_op:
        batch_op.alter_column("employment_type", type_=sa.String(length=255))


def downgrade() -> None:
    # Revert back to 64 characters
    with op.batch_alter_table("candidate") as batch_op:
        batch_op.alter_column("employment_type", type_=sa.String(length=64))
