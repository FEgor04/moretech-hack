from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import VacancyCreate, VacancyRead
from app.services import vacancies as vacancies_service
from app.services.exceptions import NotFoundError

router = APIRouter()


@router.post("/", response_model=VacancyRead, status_code=status.HTTP_201_CREATED)
async def create_vacancy(
    payload: VacancyCreate, session: AsyncSession = Depends(get_session)
):
    return await vacancies_service.create_vacancy(session, payload)


@router.get("/", response_model=list[VacancyRead])
async def list_vacancies(session: AsyncSession = Depends(get_session)):
    return await vacancies_service.list_vacancies(session)


@router.get("/{vacancy_id}", response_model=VacancyRead)
async def get_vacancy(vacancy_id: int, session: AsyncSession = Depends(get_session)):
    try:
        return await vacancies_service.get_vacancy(session, vacancy_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{vacancy_id}", response_model=VacancyRead)
async def update_vacancy(
    vacancy_id: int,
    payload: VacancyCreate,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await vacancies_service.update_vacancy(session, vacancy_id, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vacancy(vacancy_id: int, session: AsyncSession = Depends(get_session)):
    try:
        await vacancies_service.delete_vacancy(session, vacancy_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None
