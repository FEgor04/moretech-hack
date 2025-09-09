"""merge heads

Revision ID: 000014
Revises: 000011, 000009
Create Date: 2025-09-07 14:46:19.168094

"""

from typing import Sequence, Union

revision: str = "000014"
down_revision: Union[str, None] = ("000011", "000009")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
