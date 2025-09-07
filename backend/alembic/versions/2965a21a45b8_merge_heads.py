"""merge heads

Revision ID: 2965a21a45b8
Revises: 000009_add_vacancy_notes, 3a7bf0979312
Create Date: 2025-09-07 14:46:19.168094

"""

from typing import Sequence, Union

revision: str = "2965a21a45b8"
down_revision: Union[str, None] = ("000009_add_vacancy_notes", "3a7bf0979312")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
