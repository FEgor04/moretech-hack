"""Fix interview foreign key cascade

Revision ID: 000023
Revises: 000022
Create Date: 2025-01-09 19:43:50.387658

"""

from typing import Sequence, Union

from alembic import op


revision: str = "000023"
down_revision: Union[str, None] = "000022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraints on interview table
    op.drop_constraint("interview_candidate_id_fkey", "interview", type_="foreignkey")
    op.drop_constraint("interview_vacancy_id_fkey", "interview", type_="foreignkey")

    # Add new foreign key constraints with CASCADE delete
    op.create_foreign_key(
        "interview_candidate_id_fkey",
        "interview",
        "candidate",
        ["candidate_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "interview_vacancy_id_fkey",
        "interview",
        "vacancy",
        ["vacancy_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    # Drop the CASCADE foreign key constraints
    op.drop_constraint("interview_candidate_id_fkey", "interview", type_="foreignkey")
    op.drop_constraint("interview_vacancy_id_fkey", "interview", type_="foreignkey")

    # Add back the original foreign key constraints without CASCADE
    op.create_foreign_key(
        "interview_candidate_id_fkey",
        "interview",
        "candidate",
        ["candidate_id"],
        ["id"],
    )
    op.create_foreign_key(
        "interview_vacancy_id_fkey", "interview", "vacancy", ["vacancy_id"], ["id"]
    )
