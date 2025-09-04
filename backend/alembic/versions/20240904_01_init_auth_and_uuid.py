"""add password_hash to user, switch candidate id to uuid, create default user

Revision ID: 20240904_01
Revises:
Create Date: 2025-09-04
"""

import hashlib
import os
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20240904_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    # Ensure password_hash column exists
    user_columns = {col["name"]: col for col in inspector.get_columns("user")}
    if "password_hash" not in user_columns:
        op.add_column(
            "user", sa.Column("password_hash", sa.String(length=255), nullable=True)
        )

    # Convert candidate.id to VARCHAR(36) if currently integer
    candidate_columns = {col["name"]: col for col in inspector.get_columns("candidate")}
    cand_id_type = candidate_columns.get("id", {}).get("type")
    if cand_id_type is not None and isinstance(cand_id_type, sa.Integer):
        op.alter_column(
            "candidate",
            "id",
            existing_type=sa.Integer(),
            type_=sa.String(length=36),
            postgresql_using="id::text",
        )

    # Convert interview.candidate_id to VARCHAR(36) if currently integer
    interview_columns = {col["name"]: col for col in inspector.get_columns("interview")}
    int_cand_type = interview_columns.get("candidate_id", {}).get("type")
    if int_cand_type is not None and isinstance(int_cand_type, sa.Integer):
        op.alter_column(
            "interview",
            "candidate_id",
            existing_type=sa.Integer(),
            type_=sa.String(length=36),
            postgresql_using="candidate_id::text",
        )

    # Create default user if not exists
    email = os.environ.get("DEFAULT_USER_EMAIL", "admin@example.com")
    name = os.environ.get("DEFAULT_USER_NAME", "Admin")
    password = os.environ.get("DEFAULT_USER_PASSWORD", "admin")
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    meta = sa.MetaData()
    user_table = sa.Table(
        "user",
        meta,
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255)),
        sa.Column("name", sa.String(255)),
        sa.Column("role", sa.String(50)),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )
    exists = bind.execute(
        sa.select(sa.func.count())
        .select_from(user_table)
        .where(user_table.c.email == email)
    ).scalar()
    if not exists:
        bind.execute(
            user_table.insert().values(
                email=email,
                name=name,
                role="recruiter",
                password_hash=password_hash,
                created_at=sa.func.now(),
                updated_at=sa.func.now(),
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("candidate") as batch_op:
        batch_op.alter_column("id", type_=sa.Integer())
    op.drop_column("user", "password_hash")
