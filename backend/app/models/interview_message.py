from sqlalchemy import ForeignKey, Integer, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class InterviewMessageType(str):
    SYSTEM = "system"
    USER = "user"


class InterviewMessage(Base):
    __tablename__ = "interview_message"

    interview_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("interview.id", ondelete="CASCADE"), primary_key=True
    )
    index: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(
        Enum(
            InterviewMessageType.SYSTEM,
            InterviewMessageType.USER,
            name="interviewmessagetype",
        ),
        nullable=False,
    )

    interview = relationship("Interview", back_populates="messages")
