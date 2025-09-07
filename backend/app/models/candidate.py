import uuid
from datetime import datetime

from sqlalchemy import String, func, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.schemas.common import CandidateStatus


class Candidate(Base):
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    position: Mapped[str] = mapped_column(String(255))
    experience: Mapped[int] = mapped_column(Integer)
    status: Mapped[CandidateStatus] = mapped_column(
        String(64), default=CandidateStatus.PENDING
    )
    gigachat_file_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    skills: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON строка с навыками
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), onupdate=func.now()
    )
