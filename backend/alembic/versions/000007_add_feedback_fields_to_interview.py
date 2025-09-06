"""add feedback fields to interview

Revision ID: 000007
Revises: 000006
Create Date: 2025-09-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "000007"
down_revision: Union[str, None] = "000006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("interview", sa.Column("feedback", sa.Text(), nullable=True))
    op.add_column(
        "interview", sa.Column("feedback_positive", sa.Boolean(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("interview", "feedback_positive")
    op.drop_column("interview", "feedback")
