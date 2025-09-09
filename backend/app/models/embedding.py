import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, func, ForeignKey, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Import Vector conditionally to avoid import errors during migration
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    # Fallback for when pgvector is not available (e.g., during migrations)
    Vector = None

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.vacancy import Vacancy


class CandidateEmbedding(Base):
    """Embedding model for candidate CVs"""

    __tablename__ = "candidate_embeddings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    candidate_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("candidate.id", ondelete="CASCADE"), unique=True
    )
    embedding: Mapped[list[float]] = mapped_column(
        Vector(1024)
        if Vector
        else Column("embedding", String)  # 1024-dimensional vector (GigaChat)
    )
    text_content: Mapped[str] = mapped_column(
        String(10000)
    )  # The text that was embedded
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), onupdate=func.now()
    )

    # Relationships
    candidate: Mapped["Candidate"] = relationship(
        "Candidate", back_populates="embedding"
    )


class VacancyEmbedding(Base):
    """Embedding model for vacancies"""

    __tablename__ = "vacancy_embeddings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    vacancy_id: Mapped[int] = mapped_column(
        ForeignKey("vacancy.id", ondelete="CASCADE"), unique=True
    )
    embedding: Mapped[list[float]] = mapped_column(
        Vector(1024)
        if Vector
        else Column("embedding", String)  # 1024-dimensional vector (GigaChat)
    )
    text_content: Mapped[str] = mapped_column(
        String(10000)
    )  # The text that was embedded
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), onupdate=func.now()
    )

    # Relationships
    vacancy: Mapped["Vacancy"] = relationship("Vacancy", back_populates="embedding")
