from datetime import datetime

from sqlalchemy import String, Text, func, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.schemas.common import VacancyRead


class Vacancy(Base):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="open")  # open | closed
    gigachat_file_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Legacy/previous fields (retain)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    experience_level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    benefits: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Vacancy extended fields per new spec (additive)
    skills: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list[str]
    responsibilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    education: Mapped[str | None] = mapped_column(Text, nullable=True)
    minor_skills: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON list[str]
    company_info: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), onupdate=func.now()
    )

    def to_schema(self) -> VacancyRead:
        """Convert ORM model instance to Pydantic `VacancyRead` schema."""
        return VacancyRead(
            id=self.id,
            title=self.title,
            description=self.description,
            status=self.status,
            gigachat_file_id=self.gigachat_file_id,
            company=self.company,
            location=self.location,
            salary_min=self.salary_min,
            salary_max=self.salary_max,
            employment_type=self.employment_type,
            experience_level=self.experience_level,
            requirements=self.requirements,
            benefits=self.benefits,
            skills=self.skills,
            responsibilities=self.responsibilities,
            domain=self.domain,
            education=self.education,
            minor_skills=self.minor_skills,
            company_info=self.company_info,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )
