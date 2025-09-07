import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate
from app.schemas.common import CandidateCreate
from app.services.exceptions import NotFoundError


async def create_candidate(
    session: AsyncSession, payload: CandidateCreate
) -> Candidate:
    data = payload.model_dump(exclude_unset=True)
    # Преобразуем список навыков в JSON строку
    if 'skills' in data and data['skills'] is not None:
        data['skills'] = json.dumps(data['skills'], ensure_ascii=False)
    
    candidate = Candidate(**data)
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
    
    data = payload.model_dump(exclude_unset=True)
    # Преобразуем список навыков в JSON строку
    if 'skills' in data and data['skills'] is not None:
        data['skills'] = json.dumps(data['skills'], ensure_ascii=False)
    
    for key, value in data.items():
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
