import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_user(client: AsyncClient):
    # sign in as default admin
    signin = await client.post(
        "/auth/signin", json={"email": "admin@example.com", "password": "admin"}
    )
    assert signin.status_code == 200
    token = signin.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"email": "u1@example.com", "name": "User One", "role": "recruiter"}
    r = await client.post("/users/", json=payload, headers=headers)
    assert r.status_code == 201
    user = r.json()
    assert user["email"] == payload["email"]

    r2 = await client.get(f"/users/{user['id']}")
    assert r2.status_code == 200
    assert r2.json()["id"] == user["id"]
