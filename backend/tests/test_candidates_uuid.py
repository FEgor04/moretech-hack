import pytest


@pytest.mark.asyncio
async def test_candidate_uuid_crud_open(client):
    payload = {
        "name": "John Doe",
        "email": "john@example.com",
        "position": "Software Engineer",
        "experience": 3,
    }
    r = await client.post("/candidates/", json=payload)
    assert r.status_code == 201
    created = r.json()
    assert isinstance(created["id"], str) and len(created["id"]) >= 32

    cid = created["id"]
    r2 = await client.get(f"/candidates/{cid}")
    assert r2.status_code == 200
    assert r2.json()["id"] == cid
