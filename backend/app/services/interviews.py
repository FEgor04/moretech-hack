from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import Interview
from app.schemas.common import InterviewCreate
from app.services.exceptions import NotFoundError


async def create_interview(
    session: AsyncSession, payload: InterviewCreate
) -> Interview:
    interview = Interview(
        candidate_id=str(payload.candidate_id),
        vacancy_id=payload.vacancy_id,
        transcript=payload.transcript,
        recording_url=payload.recording_url,
        status=payload.status,
    )
    session.add(interview)
    await session.commit()
    await session.refresh(interview)
    return interview


async def list_interviews(session: AsyncSession) -> list[Interview]:
    result = await session.scalars(select(Interview).order_by(Interview.id))
    return list(result)


async def get_interviews_by_candidate(
    session: AsyncSession, candidate_id: str
) -> list[Interview]:
    result = await session.scalars(
        select(Interview)
        .where(Interview.candidate_id == candidate_id)
        .order_by(Interview.created_at.desc())
    )
    return list(result)


async def get_interview(session: AsyncSession, interview_id: int) -> Interview:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")
    return interview


async def update_interview(
    session: AsyncSession, interview_id: int, payload: InterviewCreate
) -> Interview:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")

    # Update fields directly
    if payload.candidate_id is not None:
        interview.candidate_id = str(payload.candidate_id)
    if payload.vacancy_id is not None:
        interview.vacancy_id = payload.vacancy_id
    if payload.transcript is not None:
        interview.transcript = payload.transcript
    if payload.recording_url is not None:
        interview.recording_url = payload.recording_url
    if payload.status is not None:
        interview.status = payload.status

    await session.commit()
    await session.refresh(interview)
    return interview


async def delete_interview(session: AsyncSession, interview_id: int) -> None:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")
    await session.delete(interview)
    await session.commit()
