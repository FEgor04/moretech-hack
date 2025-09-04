from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate
from app.schemas.common import CandidateCreate
from app.services.exceptions import NotFoundError


async def create_candidate(
    session: AsyncSession, payload: CandidateCreate
) -> Candidate:
    candidate = Candidate(**payload.model_dump(exclude_unset=True))
    session.add(candidate)
    await session.commit()
    await session.refresh(candidate)
    return candidate


async def list_candidates(session: AsyncSession) -> list[Candidate]:
    result = await session.scalars(select(Candidate).order_by(Candidate.id))
    return list(result)


async def get_candidate(session: AsyncSession, candidate_id: str) -> Candidate:
    candidate = await session.get(Candidate, candidate_id)
    if not candidate:
        raise NotFoundError("Candidate not found")
    return candidate


async def update_candidate(
    session: AsyncSession, candidate_id: str, payload: CandidateCreate
) -> Candidate:
    candidate = await session.get(Candidate, candidate_id)
    if not candidate:
        raise NotFoundError("Candidate not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(candidate, key, value)
    await session.commit()
    await session.refresh(candidate)
    return candidate


async def delete_candidate(session: AsyncSession, candidate_id: str) -> None:
    candidate = await session.get(Candidate, candidate_id)
    if not candidate:
        raise NotFoundError("Candidate not found")
    await session.delete(candidate)
    await session.commit()
