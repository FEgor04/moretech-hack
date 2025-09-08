"""update_enums_to_russian

Revision ID: 000021
Revises: 000020
Create Date: 2025-09-08 17:38:33.299127

"""

from typing import Sequence, Union

from alembic import op


revision: str = "000021"
down_revision: Union[str, None] = "000020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update employment_type values from English to Russian
    op.execute(
        """
        UPDATE candidate 
        SET employment_type = CASE 
            WHEN employment_type = 'full_time' THEN 'полная занятость'
            WHEN employment_type = 'part_time' THEN 'частичная занятость'
            WHEN employment_type = 'contract' THEN 'контракт'
            WHEN employment_type = 'internship' THEN 'стажировка'
            ELSE employment_type
        END
        WHERE employment_type IS NOT NULL
    """
    )

    op.execute(
        """
        UPDATE vacancy 
        SET employment_type = CASE 
            WHEN employment_type = 'full_time' THEN 'полная занятость'
            WHEN employment_type = 'part_time' THEN 'частичная занятость'
            WHEN employment_type = 'contract' THEN 'контракт'
            WHEN employment_type = 'internship' THEN 'стажировка'
            ELSE employment_type
        END
        WHERE employment_type IS NOT NULL
    """
    )

    # Update experience_level values from English to Russian
    op.execute(
        """
        UPDATE vacancy 
        SET experience_level = CASE 
            WHEN experience_level = 'junior' THEN 'младший'
            WHEN experience_level = 'middle' THEN 'средний'
            WHEN experience_level = 'senior' THEN 'старший'
            WHEN experience_level = 'lead' THEN 'ведущий'
            ELSE experience_level
        END
        WHERE experience_level IS NOT NULL
    """
    )


def downgrade() -> None:
    # Revert employment_type values from Russian to English
    op.execute(
        """
        UPDATE candidate 
        SET employment_type = CASE 
            WHEN employment_type = 'полная занятость' THEN 'full_time'
            WHEN employment_type = 'частичная занятость' THEN 'part_time'
            WHEN employment_type = 'контракт' THEN 'contract'
            WHEN employment_type = 'стажировка' THEN 'internship'
            ELSE employment_type
        END
        WHERE employment_type IS NOT NULL
    """
    )

    op.execute(
        """
        UPDATE vacancy 
        SET employment_type = CASE 
            WHEN employment_type = 'полная занятость' THEN 'full_time'
            WHEN employment_type = 'частичная занятость' THEN 'part_time'
            WHEN employment_type = 'контракт' THEN 'contract'
            WHEN employment_type = 'стажировка' THEN 'internship'
            ELSE employment_type
        END
        WHERE employment_type IS NOT NULL
    """
    )

    # Revert experience_level values from Russian to English
    op.execute(
        """
        UPDATE vacancy 
        SET experience_level = CASE 
            WHEN experience_level = 'младший' THEN 'junior'
            WHEN experience_level = 'средний' THEN 'middle'
            WHEN experience_level = 'старший' THEN 'senior'
            WHEN experience_level = 'ведущий' THEN 'lead'
            ELSE experience_level
        END
        WHERE experience_level IS NOT NULL
    """
    )
