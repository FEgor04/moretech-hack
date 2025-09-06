"""add interview_message table

Revision ID: 20250906_02
Revises: 20250906_01
Create Date: 2025-09-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20250906_02"
down_revision: Union[str, None] = "20250906_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


message_type = sa.Enum("system", "user", name="interviewmessagetype")


def upgrade() -> None:
    message_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "interview_message",
        sa.Column("interview_id", sa.String(length=36), nullable=False),
        sa.Column("index", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("type", message_type, nullable=False),
        sa.ForeignKeyConstraint(["interview_id"], ["interview.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("interview_id", "index"),
    )


def downgrade() -> None:
    op.drop_table("interview_message")
    message_type.drop(op.get_bind(), checkfirst=True)
