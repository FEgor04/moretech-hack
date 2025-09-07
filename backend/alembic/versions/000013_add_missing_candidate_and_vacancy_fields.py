"""add_missing_candidate_and_vacancy_fields

Revision ID: b53fc7c70f74
Revises: 8749593b87a5
Create Date: 2025-09-07 23:25:53.251107

"""

from typing import Sequence, Union


revision: str = "000013"
down_revision: Union[str, None] = "000012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
