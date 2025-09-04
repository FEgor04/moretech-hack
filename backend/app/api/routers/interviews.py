from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import InterviewCreate, InterviewRead
from app.services import interviews as interviews_service
from app.services.exceptions import NotFoundError

router = APIRouter()


@router.post("/", response_model=InterviewRead, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreate, session: AsyncSession = Depends(get_session)
):
    return await interviews_service.create_interview(session, payload)


@router.get("/", response_model=list[InterviewRead])
async def list_interviews(session: AsyncSession = Depends(get_session)):
    return await interviews_service.list_interviews(session)


@router.get("/{interview_id}", response_model=InterviewRead)
async def get_interview(
    interview_id: int, session: AsyncSession = Depends(get_session)
):
    try:
        return await interviews_service.get_interview(session, interview_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{interview_id}", response_model=InterviewRead)
async def update_interview(
    interview_id: int,
    payload: InterviewCreate,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await interviews_service.update_interview(session, interview_id, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: int, session: AsyncSession = Depends(get_session)
):
    try:
        await interviews_service.delete_interview(session, interview_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None
