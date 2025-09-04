from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.common import UserCreate
from app.services.exceptions import ConflictError, NotFoundError


async def create_user(session: AsyncSession, payload: UserCreate) -> User:
    existing = await session.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise ConflictError("User with this email already exists")
    user = User(email=payload.email, name=payload.name, role=payload.role)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def list_users(session: AsyncSession) -> list[User]:
    result = await session.scalars(select(User).order_by(User.id))
    return list(result)


async def get_user(session: AsyncSession, user_id: int) -> User:
    user = await session.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    return user


async def delete_user(session: AsyncSession, user_id: int) -> None:
    user = await session.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    await session.delete(user)
    await session.commit()
