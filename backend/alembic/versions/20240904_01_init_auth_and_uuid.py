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

    # Bootstrap schema for fresh databases: create tables if they don't exist
    if not inspector.has_table("user"):
        op.create_table(
            "user",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("role", sa.String(length=50), nullable=False),
            sa.Column("password_hash", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint("email", name="uq_user_email"),
        )
        op.create_index("ix_user_email", "user", ["email"], unique=False)

    if not inspector.has_table("vacancy"):
        op.create_table(
            "vacancy",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=64), server_default="open", nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_vacancy_title", "vacancy", ["title"], unique=False)

    if not inspector.has_table("candidate"):
        op.create_table(
            "candidate",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("user.id"), nullable=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("resume_url", sa.String(length=1024), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=64), server_default="ждем ответа", nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_candidate_email", "candidate", ["email"], unique=False)

    if not inspector.has_table("interview"):
        op.create_table(
            "interview",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("candidate_id", sa.String(length=36), sa.ForeignKey("candidate.id"), nullable=False),
            sa.Column("vacancy_id", sa.Integer, sa.ForeignKey("vacancy.id"), nullable=True),
            sa.Column("transcript", sa.Text(), nullable=True),
            sa.Column("recording_url", sa.String(length=1024), nullable=True),
            sa.Column("status", sa.String(length=64), server_default="на собеседовании", nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )

    # Ensure password_hash column exists
    if inspector.has_table("user"):
        user_columns = {col["name"]: col for col in inspector.get_columns("user")}
        if "password_hash" not in user_columns:
            op.add_column(
                "user", sa.Column("password_hash", sa.String(length=255), nullable=True)
            )

    # Convert candidate.id to VARCHAR(36) if currently integer
    if inspector.has_table("candidate"):
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
    if inspector.has_table("interview"):
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
