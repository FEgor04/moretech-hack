from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vacancy import Vacancy
from app.schemas.common import VacancyCreate
from app.services.exceptions import NotFoundError


async def create_vacancy(session: AsyncSession, payload: VacancyCreate) -> Vacancy:
    vacancy = Vacancy(**payload.model_dump(exclude_unset=True))
    session.add(vacancy)
    await session.commit()
    await session.refresh(vacancy)
    return vacancy


async def list_vacancies(session: AsyncSession) -> list[Vacancy]:
    result = await session.scalars(select(Vacancy).order_by(Vacancy.id))
    return list(result)


async def get_vacancy(session: AsyncSession, vacancy_id: int) -> Vacancy:
    vacancy = await session.get(Vacancy, vacancy_id)
    if not vacancy:
        raise NotFoundError("Vacancy not found")
    return vacancy


async def update_vacancy(
    session: AsyncSession, vacancy_id: int, payload: VacancyCreate
) -> Vacancy:
    vacancy = await session.get(Vacancy, vacancy_id)
    if not vacancy:
        raise NotFoundError("Vacancy not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(vacancy, key, value)
    await session.commit()
    await session.refresh(vacancy)
    return vacancy


async def delete_vacancy(session: AsyncSession, vacancy_id: int) -> None:
    vacancy = await session.get(Vacancy, vacancy_id)
    if not vacancy:
        raise NotFoundError("Vacancy not found")
    await session.delete(vacancy)
    await session.commit()
