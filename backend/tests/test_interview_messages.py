import pytest
from httpx import AsyncClient


@pytest.fixture
async def sample_candidate(client: AsyncClient) -> dict:
    data = {
        "name": "John Doe",
        "email": "john@example.com",
        "position": "Software Engineer",
        "experience": 3,
    }
    response = await client.post("/candidates/", json=data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
async def sample_interview(client: AsyncClient, sample_candidate: dict) -> dict:
    response = await client.post(
        "/interviews/",
        json={
            "candidate_id": sample_candidate["id"],
            "status": "scheduled",
        },
    )
    assert response.status_code == 201
    return response.json()


class TestGetInterviewMessages:
    @pytest.mark.asyncio
    async def test_get_messages_empty(
        self, client: AsyncClient, sample_interview: dict
    ):
        response = await client.get(f"/interviews/{sample_interview['id']}/messages")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_get_messages_not_found(self, client: AsyncClient):
        response = await client.get(
            "/interviews/00000000-0000-0000-0000-000000000000/messages"
        )
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]


class TestPostInterviewMessages:
    @pytest.mark.asyncio
    async def test_initialize_first_message(
        self, client: AsyncClient, sample_interview: dict
    ):
        # Initialize conversation
        r = await client.post(f"/interviews/{sample_interview['id']}/messages/first")
        assert r.status_code == 200
        messages = r.json()
        # Should create 2 messages: system prompt and first assistant greeting
        assert len(messages) == 2
        assert messages[0]["index"] == 0 and messages[0]["type"] == "system"
        assert "ассистент hr" in messages[0]["text"].lower()
        assert messages[1]["index"] == 1 and messages[1]["type"] == "assistant"
        assert "готовы начать" in messages[1]["text"].lower()

        # Subsequent call should fail (already initialized)
        r2 = await client.post(f"/interviews/{sample_interview['id']}/messages/first")
        assert r2.status_code == 400
        assert "already" in r2.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_post_creates_user_and_assistant(
        self, client: AsyncClient, sample_interview: dict
    ):
        response = await client.post(
            f"/interviews/{sample_interview['id']}/messages",
            json={"text": "Hello"},
        )
        assert response.status_code == 200
        messages = response.json()
        assert len(messages) == 2

        # Check ordering and fields
        assert messages[0]["index"] == 0
        assert messages[0]["type"] == "user"
        assert messages[0]["text"] == "Hello"
        assert messages[0]["interview_id"] == sample_interview["id"]

        assert messages[1]["index"] == 1
        assert messages[1]["type"] == "assistant"
        assert "Извините, произошла ошибка" in messages[1]["text"]
        assert messages[1]["interview_id"] == sample_interview["id"]

    @pytest.mark.asyncio
    async def test_post_appends_in_order(
        self, client: AsyncClient, sample_interview: dict
    ):
        # First message pair
        r1 = await client.post(
            f"/interviews/{sample_interview['id']}/messages", json={"text": "Hi"}
        )
        assert r1.status_code == 200
        messages1 = r1.json()
        assert len(messages1) == 2
        assert [m["index"] for m in messages1] == [0, 1]

        # Second message pair
        r2 = await client.post(
            f"/interviews/{sample_interview['id']}/messages",
            json={"text": "How are you?"},
        )
        assert r2.status_code == 200
        messages2 = r2.json()
        assert len(messages2) == 4
        assert [m["index"] for m in messages2] == [0, 1, 2, 3]
        assert messages2[2]["type"] == "user" and messages2[2]["text"] == "How are you?"
        assert (
            messages2[3]["type"] == "assistant"
            and "Извините, произошла ошибка" in messages2[3]["text"]
        )

    @pytest.mark.asyncio
    async def test_post_missing_text_validation(
        self, client: AsyncClient, sample_interview: dict
    ):
        response = await client.post(
            f"/interviews/{sample_interview['id']}/messages",
            json={},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_post_not_found(self, client: AsyncClient):
        response = await client.post(
            "/interviews/00000000-0000-0000-0000-000000000000/messages",
            json={"text": "Hello"},
        )
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]
