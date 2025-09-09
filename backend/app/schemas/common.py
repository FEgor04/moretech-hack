import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    PlainSerializer,
)
from typing import Annotated


def _to_utc_iso_z(value: datetime | None) -> str | None:
    if value is None:
        return None
    dt_utc = (
        value.replace(tzinfo=timezone.utc)
        if value.tzinfo is None
        else value.astimezone(timezone.utc)
    )
    return dt_utc.isoformat().replace("+00:00", "Z")


IsoDatetime = Annotated[
    datetime,
    PlainSerializer(_to_utc_iso_z, when_used="json"),
]


class CandidateStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    INTERVIEWING = "interviewing"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"


class EmploymentType(str, Enum):
    FULL_TIME = "полная занятость"
    PART_TIME = "частичная занятость"
    CONTRACT = "контракт"
    INTERNSHIP = "стажировка"


class ExperienceLevel(str, Enum):
    JUNIOR = "младший"
    MIDDLE = "средний"
    SENIOR = "старший"
    LEAD = "ведущий"


class InterviewState(str, Enum):
    INITIALIZED = "initialized"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class ExperienceItem(BaseModel):
    company: str
    position: str
    years: int
    start_date: datetime | None = None
    end_date: datetime | None = None


class EducationItem(BaseModel):
    organization: str
    speciality: str
    type: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class Timestamped(BaseModel):
    created_at: IsoDatetime | None = None
    updated_at: IsoDatetime | None = None


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
    # List of experience entries
    experience: list[ExperienceItem] = []
    status: CandidateStatus = CandidateStatus.PENDING
    gigachat_file_id: str | None = None
    skills: list[str] = []  # Список навыков
    # Extended CV fields
    tech: list[str] = []
    # Education entries
    education: list[EducationItem] = []
    geo: str | None = None
    employment_type: EmploymentType | None = None
    document_s3_key: str | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                # If it's not JSON, treat as comma-separated string
                return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            return v
        return []

    @field_validator("tech", mode="before")
    @classmethod
    def validate_tech(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                # If it's not JSON, treat as comma-separated string
                return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            return v
        return []

    @field_validator("education", mode="before")
    @classmethod
    def validate_education(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return []
        if isinstance(v, list):
            return v
        return []

    @field_validator("experience", mode="before")
    @classmethod
    def validate_experience_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                return []
        if isinstance(v, list):
            return v
        return []

    @field_validator("employment_type", mode="before")
    @classmethod
    def validate_employment_type(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            # Try to match the string to enum values (exact match first)
            for enum_val in EmploymentType:
                if enum_val.value == v:
                    return enum_val
            # Try case-insensitive match
            v_lower = v.lower()
            for enum_val in EmploymentType:
                if enum_val.value == v_lower:
                    return enum_val
            # If no exact match, try some common variations
            if v_lower in ["fulltime", "full-time", "full time", "полная занятость"]:
                return EmploymentType.FULL_TIME
            elif v_lower in [
                "parttime",
                "part-time",
                "part time",
                "частичная занятость",
            ]:
                return EmploymentType.PART_TIME
            elif v_lower in ["contract", "contractor", "контракт"]:
                return EmploymentType.CONTRACT
            elif v_lower in ["intern", "internship", "стажировка"]:
                return EmploymentType.INTERNSHIP
            # If no match found, return None
            return None
        return v


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
    employment_type: EmploymentType | None = None
    experience_level: ExperienceLevel | None = None
    requirements: str | None = None
    benefits: str | None = None

    # New spec fields
    skills: list[str] = []
    responsibilities: list[str] = []
    domain: str | None = None
    education: str | None = None
    minor_skills: list[str] = []
    company_info: str | None = None
    document_s3_key: str | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills_vacancy(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                # If it's not JSON, treat as comma-separated string
                return [item.strip() for item in v.split(",") if item.strip()]
        return []

    @field_validator("minor_skills", mode="before")
    @classmethod
    def validate_minor_skills(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                # If it's not JSON, treat as comma-separated string
                return [item.strip() for item in v.split(",") if item.strip()]
        return []

    @field_validator("responsibilities", mode="before")
    @classmethod
    def validate_responsibilities(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except json.JSONDecodeError:
                # If it's not JSON, treat as comma-separated string
                return [item.strip() for item in v.split(",") if item.strip()]
        return []

    @field_validator("employment_type", mode="before")
    @classmethod
    def validate_employment_type_vacancy(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            # Try to match the string to enum values (exact match first)
            for enum_val in EmploymentType:
                if enum_val.value == v:
                    return enum_val
            # Try case-insensitive match
            v_lower = v.lower()
            for enum_val in EmploymentType:
                if enum_val.value == v_lower:
                    return enum_val
            # If no exact match, try some common variations
            if v_lower in ["fulltime", "full-time", "full time", "полная занятость"]:
                return EmploymentType.FULL_TIME
            elif v_lower in [
                "parttime",
                "part-time",
                "part time",
                "частичная занятость",
            ]:
                return EmploymentType.PART_TIME
            elif v_lower in ["contract", "contractor", "контракт"]:
                return EmploymentType.CONTRACT
            elif v_lower in ["intern", "internship", "стажировка"]:
                return EmploymentType.INTERNSHIP
            # If no match found, return None
            return None
        return v

    @field_validator("experience_level", mode="before")
    @classmethod
    def validate_experience_level_vacancy(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            # Try to match the string to enum values (Russian with spaces)
            v_lower = v.lower()
            for enum_val in ExperienceLevel:
                if enum_val.value == v_lower:
                    return enum_val
            # If no exact match, try some common variations
            if v_lower in ["junior", "джуниор", "начинающий", "младший"]:
                return ExperienceLevel.JUNIOR
            elif v_lower in ["middle", "мидл", "средний"]:
                return ExperienceLevel.MIDDLE
            elif v_lower in ["senior", "сеньор", "старший"]:
                return ExperienceLevel.SENIOR
            elif v_lower in ["lead", "лид", "ведущий"]:
                return ExperienceLevel.LEAD
            # If no match found, return None
            return None
        return v


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
    employment_type: EmploymentType | None = None
    experience_level: ExperienceLevel | None = None
    requirements: str | None = None
    benefits: str | None = None
    skills: list[str] = []
    responsibilities: list[str] = []
    domain: str | None = None
    education: str | None = None
    minor_skills: list[str] = []
    company_info: str | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills_update(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        return []

    @field_validator("minor_skills", mode="before")
    @classmethod
    def validate_minor_skills_update(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        return []

    @field_validator("responsibilities", mode="before")
    @classmethod
    def validate_responsibilities_update(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        return []

    @field_validator("employment_type", mode="before")
    @classmethod
    def validate_employment_type_update(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            # Try to match the string to enum values (exact match first)
            for enum_val in EmploymentType:
                if enum_val.value == v:
                    return enum_val
            # Try case-insensitive match
            v_lower = v.lower()
            for enum_val in EmploymentType:
                if enum_val.value == v_lower:
                    return enum_val
            # If no exact match, try some common variations
            if v_lower in ["fulltime", "full-time", "full time", "полная занятость"]:
                return EmploymentType.FULL_TIME
            elif v_lower in [
                "parttime",
                "part-time",
                "part time",
                "частичная занятость",
            ]:
                return EmploymentType.PART_TIME
            elif v_lower in ["contract", "contractor", "контракт"]:
                return EmploymentType.CONTRACT
            elif v_lower in ["intern", "internship", "стажировка"]:
                return EmploymentType.INTERNSHIP
            # If no match found, return None
            return None
        return v

    @field_validator("experience_level", mode="before")
    @classmethod
    def validate_experience_level_update(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            # Try to match the string to enum values
            v_lower = v.lower().replace(" ", "_")
            for enum_val in ExperienceLevel:
                if enum_val.value == v_lower:
                    return enum_val
            # If no exact match, try some common variations
            if v_lower in ["junior", "джуниор", "начинающий"]:
                return ExperienceLevel.JUNIOR
            elif v_lower in ["middle", "мидл", "средний"]:
                return ExperienceLevel.MIDDLE
            elif v_lower in ["senior", "сеньор", "старший"]:
                return ExperienceLevel.SENIOR
            elif v_lower in ["lead", "лид", "ведущий"]:
                return ExperienceLevel.LEAD
            # If no match found, return None
            return None
        return v


class VacancyRead(VacancyBase, Timestamped):
    id: int


class InterviewBase(BaseModel):
    candidate_id: uuid.UUID = Field(..., description="UUID of the candidate")
    vacancy_id: int | None = None
    transcript: str | None = None
    recording_url: str | None = None
    status: str | None = None
    state: InterviewState = InterviewState.INITIALIZED
    feedback: str | None = None
    feedback_positive: bool | None = None


class InterviewCreate(InterviewBase):
    pass


class InterviewRead(Timestamped):
    model_config = ConfigDict(from_attributes=True)

    id: str
    candidate_id: uuid.UUID
    vacancy_id: int | None = None
    transcript: str | None = None
    recording_url: str | None = None
    state: InterviewState
    feedback: str | None = None
    feedback_positive: bool | None = None


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
    created_at: IsoDatetime | None = None


class InterviewNoteBase(BaseModel):
    interview_id: str
    text: str


class InterviewNoteCreate(InterviewNoteBase):
    pass


class InterviewNoteRead(InterviewNoteBase):
    id: int
    created_at: IsoDatetime | None = None
