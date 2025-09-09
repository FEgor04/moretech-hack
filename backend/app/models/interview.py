import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Interview(Base):
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    candidate_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("candidate.id", ondelete="CASCADE")
    )
    vacancy_id: Mapped[int | None] = mapped_column(
        ForeignKey("vacancy.id", ondelete="CASCADE"), nullable=True
    )
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="на собеседовании")
    state: Mapped[str] = mapped_column(String(32), default="initialized")
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback_positive: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), onupdate=func.now()
    )

    candidate = relationship("Candidate")
    vacancy = relationship("Vacancy")
    messages = relationship(
        "InterviewMessage",
        back_populates="interview",
        cascade="all, delete-orphan",
        order_by="InterviewMessage.index",
    )
