from datetime import datetime

from pydantic import BaseModel, EmailStr


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
    email: EmailStr
    resume_url: str | None = None
    notes: str | None = None
    status: str | None = None


class CandidateCreate(CandidateBase):
    user_id: int | None = None


class CandidateRead(CandidateBase, Timestamped):
    id: str
    user_id: int | None = None


class VacancyBase(BaseModel):
    title: str
    description: str | None = None
    status: str | None = None


class VacancyCreate(VacancyBase):
    pass


class VacancyRead(VacancyBase, Timestamped):
    id: int


class InterviewBase(BaseModel):
    candidate_id: int
    vacancy_id: int | None = None
    transcript: str | None = None
    recording_url: str | None = None
    status: str | None = None


class InterviewCreate(InterviewBase):
    pass


class InterviewRead(InterviewBase, Timestamped):
    id: int
