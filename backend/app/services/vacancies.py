from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vacancy import Vacancy
from app.models.note import Note
from app.schemas.common import VacancyCreate, VacancyUpdate, NoteCreate, NoteUpdate
import json
from app.services.exceptions import NotFoundError


async def create_vacancy(session: AsyncSession, payload: VacancyCreate) -> Vacancy:
    data = payload.model_dump(exclude_unset=True)
    # Serialize list fields
    if "skills" in data and data["skills"] is not None:
        data["skills"] = json.dumps(data["skills"], ensure_ascii=False)
    if "minor_skills" in data and data["minor_skills"] is not None:
        data["minor_skills"] = json.dumps(data["minor_skills"], ensure_ascii=False)
    if "responsibilities" in data and data["responsibilities"] is not None:
        if isinstance(data["responsibilities"], list):
            data["responsibilities"] = json.dumps(
                data["responsibilities"], ensure_ascii=False
            )
    vacancy = Vacancy(**data)
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
    session: AsyncSession, vacancy_id: int, payload: VacancyUpdate
) -> Vacancy:
    vacancy = await session.get(Vacancy, vacancy_id)
    if not vacancy:
        raise NotFoundError("Vacancy not found")
    data = payload.model_dump(exclude_unset=True)
    if "skills" in data and data["skills"] is not None:
        data["skills"] = json.dumps(data["skills"], ensure_ascii=False)
    if "minor_skills" in data and data["minor_skills"] is not None:
        data["minor_skills"] = json.dumps(data["minor_skills"], ensure_ascii=False)
    if "responsibilities" in data and data["responsibilities"] is not None:
        if isinstance(data["responsibilities"], list):
            data["responsibilities"] = json.dumps(
                data["responsibilities"], ensure_ascii=False
            )
    for key, value in data.items():
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


# Notes
async def list_notes(
    session: AsyncSession, vacancy_id: int, *, limit: int = 10, offset: int = 0
) -> list[Note]:
    await get_vacancy(session, vacancy_id)
    result = await session.scalars(
        select(Note)
        .where(Note.vacancy_id == vacancy_id)
        .order_by(Note.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result)


async def create_note(session: AsyncSession, payload: NoteCreate) -> Note:
    await get_vacancy(session, payload.vacancy_id)
    note = Note(**payload.model_dump(exclude_unset=True))
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return note


async def update_note(session: AsyncSession, note_id: int, payload: NoteUpdate) -> Note:
    note = await session.get(Note, note_id)
    if not note:
        raise NotFoundError("Note not found")
    note.text = payload.text
    await session.commit()
    await session.refresh(note)
    return note


async def delete_note(session: AsyncSession, note_id: int) -> None:
    note = await session.get(Note, note_id)
    if not note:
        raise NotFoundError("Note not found")
    await session.delete(note)
    await session.commit()
