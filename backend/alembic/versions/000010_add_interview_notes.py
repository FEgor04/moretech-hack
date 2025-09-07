"""add interview notes

Revision ID: 000010_add_interview_notes
Revises: 2965a21a45b8
Create Date: 2025-09-07 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "000010_add_interview_notes"
down_revision: Union[str, None] = "2965a21a45b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "interview_note",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "interview_id",
            sa.String(),
            sa.ForeignKey("interview.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("interview_note")
