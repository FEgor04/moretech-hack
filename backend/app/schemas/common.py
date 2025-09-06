import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class CandidateStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    INTERVIEWING = "interviewing"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"


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


class CandidateCreate(CandidateBase):
    pass


class CandidateRead(CandidateBase, Timestamped):
    id: str


class VacancyBase(BaseModel):
    title: str
    description: str | None = None
    status: str | None = None
    gigachat_file_id: str | None = None


class VacancyCreate(VacancyBase):
    pass


class VacancyRead(VacancyBase, Timestamped):
    id: int


class InterviewBase(BaseModel):
    candidate_id: uuid.UUID = Field(..., description="UUID of the candidate")
    vacancy_id: int | None = None
    transcript: str | None = None
    recording_url: str | None = None
    status: str | None = None


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
