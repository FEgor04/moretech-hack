"""Make candidate email optional

Revision ID: 20250109_02
Revises: c33ffcc92bf6
Create Date: 2025-01-09 16:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20250109_02"
down_revision: Union[str, None] = "c33ffcc92bf6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make candidate email column nullable
    op.alter_column("candidate", "email", existing_type=sa.String(255), nullable=True)


def downgrade() -> None:
    # Make candidate email column not nullable again
    # Note: This will fail if there are any NULL emails in the database
    op.alter_column("candidate", "email", existing_type=sa.String(255), nullable=False)
