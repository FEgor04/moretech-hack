import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Union


class CandidateStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    INTERVIEWING = "interviewing"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"


class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class ExperienceLevel(str, Enum):
    JUNIOR = "junior"
    MIDDLE = "middle"
    SENIOR = "senior"
    LEAD = "lead"


class Timestamped(BaseModel):
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str


class UserCreate(UserBase):
    pass


class UserRead(UserBase, Timestamped):
    id: int


class CandidateBase(BaseModel):
    name: str
    email: EmailStr | None = None
    position: str
    experience: int
    status: CandidateStatus = CandidateStatus.PENDING
    gigachat_file_id: str | None = None
    skills: Union[list[str], str, None] = None  # Список навыков или JSON строка

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return [v]  # Если не JSON, то считаем одной строкой
        if isinstance(v, list):
            return v
        return None


class CandidateCreate(CandidateBase):
    pass


class CandidateRead(CandidateBase, Timestamped):
    id: str


class VacancyBase(BaseModel):
    title: str
    description: str | None = None
    status: str | None = None
    gigachat_file_id: str | None = None

    # Новые поля
    company: str | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    employment_type: EmploymentType | None = None
    experience_level: ExperienceLevel | None = None
    remote_work: bool = False
    requirements: str | None = None
    benefits: str | None = None

    # Normalize enums that might come with dashes from DB or external sources
    @field_validator("employment_type", mode="before")
    @classmethod
    def normalize_employment_type(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.replace("-", "_")
            try:
                return EmploymentType(normalized)
            except Exception:
                return normalized
        return value

    @field_validator("experience_level", mode="before")
    @classmethod
    def normalize_experience_level(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.replace("-", "_")
            try:
                return ExperienceLevel(normalized)
            except Exception:
                return normalized
        return value


class VacancyCreate(VacancyBase):
    pass


class VacancyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    gigachat_file_id: str | None = None
    company: str | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    employment_type: EmploymentType | None = None
    experience_level: ExperienceLevel | None = None
    remote_work: bool | None = None
    requirements: str | None = None
    benefits: str | None = None

    # The update payload may also contain dashed enum values
    @field_validator("employment_type", mode="before")
    @classmethod
    def normalize_employment_type_update(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.replace("-", "_")
            try:
                return EmploymentType(normalized)
            except Exception:
                return normalized
        return value

    @field_validator("experience_level", mode="before")
    @classmethod
    def normalize_experience_level_update(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.replace("-", "_")
            try:
                return ExperienceLevel(normalized)
            except Exception:
                return normalized
        return value


class VacancyRead(VacancyBase, Timestamped):
    id: int


class InterviewBase(BaseModel):
    candidate_id: uuid.UUID = Field(..., description="UUID of the candidate")
    vacancy_id: int | None = None
    transcript: str | None = None
    recording_url: str | None = None
    status: str | None = None
    feedback: str | None = None
    feedback_positive: bool | None = None


class InterviewCreate(InterviewBase):
    pass


class InterviewRead(InterviewBase, Timestamped):
    id: str


class InterviewMessageType(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class InterviewMessageBase(BaseModel):
    interview_id: uuid.UUID
    index: int
    text: str | None = None
    type: InterviewMessageType


class InterviewMessageCreate(InterviewMessageBase):
    pass


class InterviewMessageRead(InterviewMessageBase):
    pass


class InterviewMessageCreateRequest(BaseModel):
    text: str
