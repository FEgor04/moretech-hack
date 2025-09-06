from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import Interview
from app.models.candidate import Candidate
from app.models.vacancy import Vacancy
from app.models.interview_message import InterviewMessage, InterviewMessageType
from app.schemas.common import InterviewCreate, InterviewMessageCreateRequest
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


async def get_interview(session: AsyncSession, interview_id: str) -> Interview:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")
    return interview


async def update_interview(
    session: AsyncSession, interview_id: str, payload: InterviewCreate
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


async def delete_interview(session: AsyncSession, interview_id: str) -> None:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")
    await session.delete(interview)
    await session.commit()


# Interview messages


async def list_interview_messages(
    session: AsyncSession, interview_id: str
) -> list[InterviewMessage]:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")
    result = await session.scalars(
        select(InterviewMessage)
        .where(InterviewMessage.interview_id == interview_id)
        .order_by(InterviewMessage.index)
    )
    return list(result)


async def create_interview_message(
    session: AsyncSession, interview_id: str, payload: InterviewMessageCreateRequest
) -> list[InterviewMessage]:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")

    # get next index
    next_index_result = await session.execute(
        select(func.coalesce(func.max(InterviewMessage.index), -1) + 1).where(
            InterviewMessage.interview_id == interview_id
        )
    )
    next_index = next_index_result.scalar_one()

    user_message = InterviewMessage(
        interview_id=interview_id,
        index=next_index,
        text=payload.text,
        type=InterviewMessageType.USER,
    )
    session.add(user_message)

    # Mock assistant response for now
    assistant_message = InterviewMessage(
        interview_id=interview_id,
        index=next_index + 1,
        text="TODO: implement API",
        type=InterviewMessageType.SYSTEM,
    )
    session.add(assistant_message)

    await session.commit()

    # Return updated list
    result = await session.scalars(
        select(InterviewMessage)
        .where(InterviewMessage.interview_id == interview_id)
        .order_by(InterviewMessage.index)
    )
    return list(result)


def get_system_prompt(candidate: Candidate, vacancy: Vacancy | None) -> str:
    vacancy_part = (
        f"Вакансия: {vacancy.title}. Описание: {vacancy.description or 'нет описания.'}"
        if vacancy
        else "Вакансия не указана."
    )
    return (
        "Ты ассистент HR, проводишь первичное интервью. "
        "Собери краткую информацию, будь дружелюбен и говори по-русски. "
        f"Кандидат: {candidate.name}, позиция: {candidate.position}, опыт: {candidate.experience} лет. "
        f"{vacancy_part}"
    )


async def initialize_first_message(
    session: AsyncSession, interview_id: str
) -> list[InterviewMessage]:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")

    # Ensure no messages exist yet
    existing = await session.scalar(
        select(func.count())
        .select_from(InterviewMessage)
        .where(InterviewMessage.interview_id == interview_id)
    )
    if existing and int(existing) > 0:
        raise ValueError("Conversation already initialized")

    candidate = await session.get(Candidate, interview.candidate_id)
    if not candidate:
        raise NotFoundError("Candidate not found for interview")

    vacancy: Vacancy | None = None
    if interview.vacancy_id is not None:
        vacancy = await session.get(Vacancy, interview.vacancy_id)

    system_text = get_system_prompt(candidate, vacancy)

    # Store system prompt as first message (index 0)
    system_message = InterviewMessage(
        interview_id=interview_id,
        index=0,
        text=system_text,
        type=InterviewMessageType.SYSTEM,
    )
    session.add(system_message)

    # Ask LLM to generate first message for user — mock for now
    first_message_text = (
        "Здравствуйте! Я виртуальный HR-ассистент. Готовы начать интервью?"
    )
    first_assistant = InterviewMessage(
        interview_id=interview_id,
        index=1,
        text=first_message_text,
        type=InterviewMessageType.SYSTEM,
    )
    session.add(first_assistant)

    await session.commit()

    result = await session.scalars(
        select(InterviewMessage)
        .where(InterviewMessage.interview_id == interview_id)
        .order_by(InterviewMessage.index)
    )
    return list(result)
