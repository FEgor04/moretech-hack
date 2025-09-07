"""merge_heads_final

Revision ID: 8749593b87a5
Revises: 000010_add_interview_notes, 000011
Create Date: 2025-09-07 23:25:43.264634

"""

from typing import Sequence, Union



revision: str = "000012"
down_revision: Union[str, None] = ("000010_add_interview_notes", "000011")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
