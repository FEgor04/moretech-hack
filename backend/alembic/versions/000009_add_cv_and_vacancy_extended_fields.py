"""add extended fields to candidate and vacancy

Revision ID: 000009
Revises: 000008
Create Date: 2025-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect, text


# revision identifiers, used by Alembic.
revision: str = "000009"
down_revision: Union[str, None] = "3a7bf0979312"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    def column_exists(table: str, column: str) -> bool:
        return bool(
            bind.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = :t AND column_name = :c
                    """
                ),
                {"t": table, "c": column},
            ).scalar()
        )

    # Candidate extended fields
    # If legacy integer experience column exists, rename it to experience_years first
    if inspector.has_table("candidate"):
        cand_cols = {col["name"]: col for col in inspector.get_columns("candidate")}
        if "experience" in cand_cols and isinstance(
            cand_cols["experience"]["type"], sa.Integer
        ):
            with op.batch_alter_table("candidate") as batch_op:
                batch_op.alter_column("experience", new_column_name="experience_years")

    # Refresh columns after potential rename
    if inspector.has_table("candidate"):
        {
            col["name"]: col for col in inspector.get_columns("candidate")
        }

    with op.batch_alter_table("candidate") as batch_op:
        # Add new columns (additive and non-destructive) only if missing
        if not column_exists("candidate", "tech"):
            batch_op.add_column(sa.Column("tech", sa.Text(), nullable=True))
        if not column_exists("candidate", "education"):
            batch_op.add_column(sa.Column("education", sa.Text(), nullable=True))
        if not column_exists("candidate", "positions"):
            batch_op.add_column(sa.Column("positions", sa.Text(), nullable=True))
        if not column_exists("candidate", "geo"):
            batch_op.add_column(sa.Column("geo", sa.String(length=255), nullable=True))
        if not column_exists("candidate", "employment_type"):
            batch_op.add_column(
                sa.Column("employment_type", sa.String(length=64), nullable=True)
            )
        # Ensure experience_years exists (in case no legacy column)
        if not column_exists("candidate", "experience_years"):
            batch_op.add_column(
                sa.Column("experience_years", sa.Integer(), nullable=True)
            )
        # Add new JSON experience column
        if not column_exists("candidate", "experience"):
            batch_op.add_column(sa.Column("experience", sa.Text(), nullable=True))

    # Vacancy extended fields
    # Vacancy extended fields
    if inspector.has_table("vacancy"):
        {col["name"]: col for col in inspector.get_columns("vacancy")}

    with op.batch_alter_table("vacancy") as batch_op:
        if not column_exists("vacancy", "skills"):
            batch_op.add_column(sa.Column("skills", sa.Text(), nullable=True))
        if not column_exists("vacancy", "experience"):
            batch_op.add_column(sa.Column("experience", sa.Text(), nullable=True))
        if not column_exists("vacancy", "responsibilities"):
            batch_op.add_column(sa.Column("responsibilities", sa.Text(), nullable=True))
        if not column_exists("vacancy", "domain"):
            batch_op.add_column(
                sa.Column("domain", sa.String(length=255), nullable=True)
            )
        if not column_exists("vacancy", "education"):
            batch_op.add_column(sa.Column("education", sa.Text(), nullable=True))
        if not column_exists("vacancy", "minor_skills"):
            batch_op.add_column(sa.Column("minor_skills", sa.Text(), nullable=True))
        if not column_exists("vacancy", "company_info"):
            batch_op.add_column(sa.Column("company_info", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("vacancy") as batch_op:
        batch_op.drop_column("company_info")
        batch_op.drop_column("minor_skills")
        batch_op.drop_column("education")
        batch_op.drop_column("domain")
        batch_op.drop_column("responsibilities")
        batch_op.drop_column("experience")
        batch_op.drop_column("skills")

    with op.batch_alter_table("candidate") as batch_op:
        batch_op.drop_column("experience_years")
        batch_op.drop_column("experience")
        batch_op.drop_column("employment_type")
        batch_op.drop_column("geo")
        batch_op.drop_column("positions")
        batch_op.drop_column("education")
        batch_op.drop_column("tech")
