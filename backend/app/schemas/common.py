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
    # List of experience entries: {company, position, years}
    experience: Union[list[dict], str, None] = None
    # Preserve legacy numeric years
    experience_years: int | None = None
    status: CandidateStatus = CandidateStatus.PENDING
    gigachat_file_id: str | None = None
    skills: Union[list[str], str, None] = None  # Список навыков или JSON строка
    # Extended CV fields
    tech: Union[list[str], str, None] = None  # JSON string or list
    # Education entries: list of {organization, speciality, type?}
    education: Union[list[dict], str, None] = None
    geo: str | None = None
    employment_type: str | None = None

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

    @field_validator("tech", mode="before")
    @classmethod
    def validate_tech(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        if isinstance(v, list):
            return v
        return None

    @field_validator("education", mode="before")
    @classmethod
    def validate_education(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return v
        if isinstance(v, list):
            return v
        return v

    @field_validator("experience", mode="before")
    @classmethod
    def validate_experience_list(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return v
        # If list, normalize entries to include numeric years when provided as strings
        if isinstance(v, list):
            return v
        return v

    @field_validator("experience_years", mode="before")
    @classmethod
    def coerce_experience_years(cls, v):
        if v is None:
            return None
        try:
            # Handle floats and numeric strings
            if isinstance(v, (int,)):
                return v
            if isinstance(v, float):
                return int(round(v))
            if isinstance(v, str):
                v = v.strip()
                if not v:
                    return None
                # Replace comma decimal separator if present
                v_norm = v.replace(",", ".")
                f = float(v_norm)
                return int(round(f))
        except Exception:
            return None
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
    # Legacy/previous fields (retain)
    company: str | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    employment_type: str | None = None
    experience_level: str | None = None
    remote_work: bool = False
    requirements: str | None = None
    benefits: str | None = None

    # New spec fields
    skills: Union[list[str], str, None] = None
    experience: str | None = None
    responsibilities: Union[list[str], str, None] = None
    domain: str | None = None
    education: str | None = None
    minor_skills: Union[list[str], str, None] = None
    company_info: str | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills_vacancy(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        if isinstance(v, list):
            return v
        return None

    @field_validator("minor_skills", mode="before")
    @classmethod
    def validate_minor_skills(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        if isinstance(v, list):
            return v
        return None

    @field_validator("responsibilities", mode="before")
    @classmethod
    def validate_responsibilities(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                loaded = json.loads(v)
                if isinstance(loaded, list):
                    return loaded
                return v
            except json.JSONDecodeError:
                return v
        if isinstance(v, list):
            return v
        return None


class VacancyCreate(VacancyBase):
    pass


class VacancyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    gigachat_file_id: str | None = None
    # Legacy/previous fields (retain)
    company: str | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    employment_type: str | None = None
    experience_level: str | None = None
    remote_work: bool | None = None
    requirements: str | None = None
    benefits: str | None = None
    skills: Union[list[str], str, None] = None
    experience: str | None = None
    responsibilities: Union[list[str], str, None] = None
    domain: str | None = None
    education: str | None = None
    minor_skills: Union[list[str], str, None] = None
    company_info: str | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills_update(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        if isinstance(v, list):
            return v
        return None

    @field_validator("minor_skills", mode="before")
    @classmethod
    def validate_minor_skills_update(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        if isinstance(v, list):
            return v
        return None

    @field_validator("responsibilities", mode="before")
    @classmethod
    def validate_responsibilities_update(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json

                loaded = json.loads(v)
                if isinstance(loaded, list):
                    return loaded
                return v
            except json.JSONDecodeError:
                return v
        if isinstance(v, list):
            return v
        return None


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


class NoteBase(BaseModel):
    vacancy_id: int
    text: str


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    text: str


class NoteRead(NoteBase):
    id: int
    created_at: datetime | None = None


class InterviewNoteBase(BaseModel):
    interview_id: str
    text: str


class InterviewNoteCreate(InterviewNoteBase):
    pass


class InterviewNoteRead(InterviewNoteBase):
    id: int
    created_at: datetime | None = None
