from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import Interview
from app.schemas.common import InterviewCreate
from app.services.exceptions import NotFoundError


async def create_interview(
    session: AsyncSession, payload: InterviewCreate
) -> Interview:
    interview = Interview(**payload.model_dump(exclude_unset=True))
    session.add(interview)
    await session.commit()
    await session.refresh(interview)
    return interview


async def list_interviews(session: AsyncSession) -> list[Interview]:
    result = await session.scalars(select(Interview).order_by(Interview.id))
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
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(interview, key, value)
    await session.commit()
    await session.refresh(interview)
    return interview


async def delete_interview(session: AsyncSession, interview_id: int) -> None:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")
    await session.delete(interview)
    await session.commit()
