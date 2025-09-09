"""Fix JSONB conversion with proper data casting

Revision ID: 000020
Revises: 000019
Create Date: 2025-09-08 15:15:56.653347

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "000020"
down_revision: Union[str, None] = "000019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update candidate experience field to JSONB with proper casting
    # Handle both JSON strings and null values
    op.execute(
        """
        ALTER TABLE candidate 
        ALTER COLUMN experience 
        TYPE JSONB 
        USING CASE 
            WHEN experience IS NULL THEN NULL
            WHEN experience = '' THEN NULL
            ELSE experience::JSONB 
        END
    """
    )

    # Update candidate tech field to JSONB with proper casting
    op.execute(
        """
        ALTER TABLE candidate 
        ALTER COLUMN tech 
        TYPE JSONB 
        USING CASE 
            WHEN tech IS NULL THEN NULL
            WHEN tech = '' THEN NULL
            ELSE tech::JSONB 
        END
    """
    )

    # Update candidate education field to JSONB with proper casting
    op.execute(
        """
        ALTER TABLE candidate 
        ALTER COLUMN education 
        TYPE JSONB 
        USING CASE 
            WHEN education IS NULL THEN NULL
            WHEN education = '' THEN NULL
            ELSE education::JSONB 
        END
    """
    )

    # Remove experience_years column from candidate (if it exists)
    try:
        op.drop_column("candidate", "experience_years")
    except Exception:
        pass  # Column might not exist

    # Remove remote_work column from vacancy (if it exists)
    try:
        op.drop_column("vacancy", "remote_work")
    except Exception:
        pass  # Column might not exist

    # Remove experience column from vacancy (if it exists)
    try:
        op.drop_column("vacancy", "experience")
    except Exception:
        pass  # Column might not exist


def downgrade() -> None:
    # Add back experience_years column to candidate
    op.add_column(
        "candidate", sa.Column("experience_years", sa.INTEGER(), nullable=True)
    )

    # Add back remote_work column to vacancy
    op.add_column(
        "vacancy",
        sa.Column("remote_work", sa.BOOLEAN(), nullable=False, server_default="false"),
    )

    # Add back experience column to vacancy
    op.add_column("vacancy", sa.Column("experience", sa.TEXT(), nullable=True))

    # Revert candidate education field to TEXT
    op.execute(
        """
        ALTER TABLE candidate 
        ALTER COLUMN education 
        TYPE TEXT 
        USING CASE 
            WHEN education IS NULL THEN NULL
            ELSE education::TEXT 
        END
    """
    )

    # Revert candidate tech field to TEXT
    op.execute(
        """
        ALTER TABLE candidate 
        ALTER COLUMN tech 
        TYPE TEXT 
        USING CASE 
            WHEN tech IS NULL THEN NULL
            ELSE tech::TEXT 
        END
    """
    )

    # Revert candidate experience field to TEXT
    op.execute(
        """
        ALTER TABLE candidate 
        ALTER COLUMN experience 
        TYPE TEXT 
        USING CASE 
            WHEN experience IS NULL THEN NULL
            ELSE experience::TEXT 
        END
    """
    )
