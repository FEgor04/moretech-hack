from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.session import get_session
from app.schemas.common import (
    InterviewCreate,
    InterviewRead,
    InterviewMessageRead,
    InterviewMessageCreateRequest,
    InterviewNoteCreate,
    InterviewNoteRead,
)
from app.services import interviews as interviews_service
from app.services.exceptions import NotFoundError, ConflictError

router = APIRouter()


@router.post("/", response_model=InterviewRead, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreate, session: AsyncSession = Depends(get_session)
):
    try:
        return await interviews_service.create_interview(session, payload)
    except IntegrityError:
        raise HTTPException(
            status_code=400, detail="Invalid candidate_id or vacancy_id"
        )


@router.get("/", response_model=list[InterviewRead])
async def list_interviews(session: AsyncSession = Depends(get_session)):
    return await interviews_service.list_interviews(session)


@router.get("/candidate/{candidate_id}", response_model=list[InterviewRead])
async def get_interviews_by_candidate(
    candidate_id: str, session: AsyncSession = Depends(get_session)
):
    return await interviews_service.get_interviews_by_candidate(session, candidate_id)


@router.get("/{interview_id}", response_model=InterviewRead)
async def get_interview(
    interview_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        return await interviews_service.get_interview(session, interview_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{interview_id}", response_model=InterviewRead)
async def update_interview(
    interview_id: str,
    payload: InterviewCreate,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await interviews_service.update_interview(session, interview_id, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=400, detail="Invalid candidate_id or vacancy_id"
        )


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        await interviews_service.delete_interview(session, interview_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None


@router.get("/{interview_id}/messages", response_model=list[InterviewMessageRead])
async def get_interview_messages(
    interview_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        return await interviews_service.list_interview_messages(session, interview_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{interview_id}/messages", response_model=list[InterviewMessageRead])
async def post_interview_message(
    interview_id: str,
    payload: InterviewMessageCreateRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await interviews_service.create_interview_message(
            session, interview_id, payload
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post(
    "/{interview_id}/messages/first", response_model=list[InterviewMessageRead]
)
async def initialize_first_message(
    interview_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        return await interviews_service.initialize_first_message(session, interview_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{interview_id}/notes", response_model=list[InterviewNoteRead])
async def list_interview_notes(
    interview_id: str,
    session: AsyncSession = Depends(get_session),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await interviews_service.list_notes(
        session, interview_id, limit=limit, offset=offset
    )


@router.post(
    "/{interview_id}/notes",
    response_model=InterviewNoteRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_interview_note(
    interview_id: str,
    payload: InterviewNoteCreate,
    session: AsyncSession = Depends(get_session),
):
    payload.interview_id = interview_id
    return await interviews_service.create_note(session, payload)


@router.delete(
    "/{interview_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_interview_note(
    interview_id: str, note_id: int, session: AsyncSession = Depends(get_session)
):
    try:
        await interviews_service.delete_note(session, note_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None
