"""merge heads

Revision ID: 000019
Revises: 000017, 000018
Create Date: 2025-09-08 10:46:40.573357

"""

from typing import Sequence, Union


revision: str = "000019"
down_revision: Union[str, None] = ("000017", "000018")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
