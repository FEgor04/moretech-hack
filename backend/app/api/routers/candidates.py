from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import CandidateCreate, CandidateRead
from app.services import candidates as candidates_service
from app.services.exceptions import NotFoundError

router = APIRouter()


@router.post("/", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: CandidateCreate, session: AsyncSession = Depends(get_session)
):
    return await candidates_service.create_candidate(session, payload)


@router.get("/", response_model=list[CandidateRead])
async def list_candidates(session: AsyncSession = Depends(get_session)):
    return await candidates_service.list_candidates(session)


@router.get("/{candidate_id}", response_model=CandidateRead)
async def get_candidate(
    candidate_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        return await candidates_service.get_candidate(session, candidate_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{candidate_id}", response_model=CandidateRead)
async def update_candidate(
    candidate_id: str,
    payload: CandidateCreate,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await candidates_service.update_candidate(session, candidate_id, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        await candidates_service.delete_candidate(session, candidate_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None
