import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import Interview
from app.models.interview_message import InterviewMessage
from app.models.interview_note import InterviewNote
from app.schemas.common import (
    InterviewCreate,
    InterviewMessageCreateRequest,
    InterviewNoteCreate,
)
from app.services.exceptions import NotFoundError
from app.services.interview_messages import interview_messages_service

logger = logging.getLogger(__name__)


async def create_interview(
    session: AsyncSession, payload: InterviewCreate
) -> Interview:
    interview = Interview(
        candidate_id=str(payload.candidate_id),
        vacancy_id=payload.vacancy_id,
        transcript=payload.transcript,
        recording_url=payload.recording_url,
        status=payload.status,
        state=payload.state.value,
        feedback=payload.feedback,
        feedback_positive=payload.feedback_positive,
    )
    session.add(interview)
    await session.commit()
    await session.refresh(interview)

    if payload.feedback is not None or payload.feedback_positive is not None:
        logger.info(
            "Interview %s initial feedback recorded (positive=%s, length=%s)",
            interview.id,
            payload.feedback_positive,
            len(payload.feedback) if isinstance(payload.feedback, str) else 0,
        )
    return interview


async def list_interviews(session: AsyncSession) -> list[Interview]:
    result = await session.scalars(
        select(Interview).order_by(Interview.created_at.desc())
    )
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
    if payload.state is not None:
        # Allow direct state updates via API (used by tests); value may be enum or str
        try:
            interview.state = payload.state.value
        except AttributeError:
            interview.state = str(payload.state)
    if payload.feedback is not None:
        interview.feedback = payload.feedback
    if payload.feedback_positive is not None:
        interview.feedback_positive = payload.feedback_positive

    if payload.feedback is not None or payload.feedback_positive is not None:
        logger.info(
            "Interview %s feedback updated (positive=%s, length=%s)",
            interview_id,
            payload.feedback_positive,
            len(payload.feedback) if isinstance(payload.feedback, str) else 0,
        )

    await session.commit()
    await session.refresh(interview)
    return interview


async def delete_interview(session: AsyncSession, interview_id: str) -> None:
    interview = await session.get(Interview, interview_id)
    if not interview:
        raise NotFoundError("Interview not found")
    await session.delete(interview)
    await session.commit()


# Interview messages - delegated to interview_messages_service


async def list_interview_messages(
    session: AsyncSession, interview_id: str
) -> list[InterviewMessage]:
    """List all messages for an interview."""
    all_messages = await interview_messages_service.list_messages(session, interview_id)
    return [message for message in all_messages if message.index > 0]


async def create_interview_message(
    session: AsyncSession, interview_id: str, payload: InterviewMessageCreateRequest
) -> list[InterviewMessage]:
    """Create a new user message and get AI response."""
    return await interview_messages_service.create_message(
        session, interview_id, payload
    )


# Interview notes
async def list_notes(
    session: AsyncSession, interview_id: str, *, limit: int = 10, offset: int = 0
) -> list[InterviewNote]:
    await get_interview(session, interview_id)
    result = await session.scalars(
        select(InterviewNote)
        .where(InterviewNote.interview_id == interview_id)
        .order_by(InterviewNote.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result)


async def create_note(
    session: AsyncSession, payload: InterviewNoteCreate
) -> InterviewNote:
    await get_interview(session, payload.interview_id)
    note = InterviewNote(**payload.model_dump(exclude_unset=True))
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return note


async def delete_note(session: AsyncSession, note_id: int) -> None:
    note = await session.get(InterviewNote, note_id)
    if not note:
        raise NotFoundError("Note not found")
    await session.delete(note)
    await session.commit()


async def initialize_first_message(
    session: AsyncSession, interview_id: str
) -> list[InterviewMessage]:
    """Initialize conversation with system prompt and first AI message."""
    return await interview_messages_service.initialize_conversation(
        session, interview_id
    )
