import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Literal, TypedDict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User

TokenType = Literal["user", "candidate"]


class TokenPayload(TypedDict, total=False):
    sub: str
    type: TokenType
    exp: int
    user_id: int
    candidate_id: int


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64urldecode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding and padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("ascii"))


def _sign(data: bytes) -> str:
    return _b64url(
        hmac.new(settings.auth_secret.encode(), data, hashlib.sha256).digest()
    )


def generate_token(payload: TokenPayload, expires_in_minutes: int = 60) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = dict(payload)
    payload.setdefault(
        "exp",
        int(
            (
                datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)
            ).timestamp()
        ),
    )
    token_unsigned = f"{_b64url(json.dumps(header, separators=(',', ':')).encode())}.{_b64url(json.dumps(payload, separators=(',', ':')).encode())}"
    signature = _sign(token_unsigned.encode())
    return f"{token_unsigned}.{signature}"


def decode_token(token: str) -> TokenPayload:
    try:
        header_b64, payload_b64, signature = token.split(".")
        expected_sig = _sign(f"{header_b64}.{payload_b64}".encode())
        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")
        payload: TokenPayload = json.loads(_b64urldecode(payload_b64))  # type: ignore[assignment]
    except Exception as e:  # noqa: BLE001
        raise ValueError("Invalid token") from e

    if "exp" in payload and int(payload["exp"]) < int(
        datetime.now(timezone.utc).timestamp()
    ):
        raise ValueError("Token expired")
    return payload


def hash_password(raw_password: str) -> str:
    return hashlib.sha256(raw_password.encode()).hexdigest()


def verify_password(raw_password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    return hmac.compare_digest(hash_password(raw_password), password_hash)


async def authenticate_user(
    session: AsyncSession, email: str, password: str
) -> User | None:
    user = await session.scalar(select(User).where(User.email == email))
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
