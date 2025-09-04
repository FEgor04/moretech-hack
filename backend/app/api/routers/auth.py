from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.auth import authenticate_user, decode_token, generate_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    user_id: int


@router.post("/signin", response_model=TokenResponse)
async def signin(payload: SignInRequest, session: AsyncSession = Depends(get_session)):
    user = await authenticate_user(session, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = generate_token({"sub": str(user.id), "type": "user", "user_id": user.id})
    return TokenResponse(access_token=token)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> int:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    if payload.get("type") != "user" or not payload.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token type"
        )
    return int(payload["user_id"])  # type: ignore[return-value]


def get_candidate_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> int:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    if payload.get("type") != "candidate" or not payload.get("candidate_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token type"
        )
    return int(payload["candidate_id"])  # type: ignore[return-value]


@router.get("/me", response_model=MeResponse)
async def me(user_id: int = Depends(get_current_user_id)):
    return MeResponse(user_id=user_id)
