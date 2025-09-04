from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routers.auth import get_current_user_id
from app.db.session import get_session
from app.schemas.common import UserCreate, UserRead
from app.services import users as users_service
from app.services.exceptions import ConflictError, NotFoundError

router = APIRouter()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    session: AsyncSession = Depends(get_session),
    _user_id: int = Depends(get_current_user_id),
):
    try:
        return await users_service.create_user(session, payload)
    except ConflictError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[UserRead])
async def list_users(session: AsyncSession = Depends(get_session)):
    return await users_service.list_users(session)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: int, session: AsyncSession = Depends(get_session)):
    try:
        return await users_service.get_user(session, user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, session: AsyncSession = Depends(get_session)):
    try:
        await users_service.delete_user(session, user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None
