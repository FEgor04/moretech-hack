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

        # Interview state should now be in_progress
        r_state = await client.get(f"/interviews/{sample_interview['id']}")
        assert r_state.status_code == 200
        assert r_state.json()["state"] == "in_progress"

        # Subsequent call should fail (already initialized)
        r2 = await client.post(f"/interviews/{sample_interview['id']}/messages/first")
        assert r2.status_code == 409
        assert "already" in r2.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_post_creates_user_and_assistant(
        self, client: AsyncClient, sample_interview: dict
    ):
        # Before initialization, posting should be blocked
        blocked = await client.post(
            f"/interviews/{sample_interview['id']}/messages", json={"text": "Hello"}
        )
        assert blocked.status_code == 409

        # Initialize first
        r_init = await client.post(
            f"/interviews/{sample_interview['id']}/messages/first"
        )
        assert r_init.status_code == 200

        # Now posting should work
        response = await client.post(
            f"/interviews/{sample_interview['id']}/messages", json={"text": "Hello"}
        )
        assert response.status_code == 200
        messages = response.json()
        assert len(messages) == 4

        # Check ordering and fields for the new pair after initial system+assistant
        assert [m["index"] for m in messages] == [0, 1, 2, 3]

        assert messages[2]["type"] == "user"
        assert messages[2]["text"] == "Hello"
        assert messages[2]["interview_id"] == sample_interview["id"]

        assert messages[3]["type"] == "assistant"
        assert "Извините, произошла ошибка" in messages[3]["text"]
        assert messages[3]["interview_id"] == sample_interview["id"]

    @pytest.mark.asyncio
    async def test_post_appends_in_order(
        self, client: AsyncClient, sample_interview: dict
    ):
        # Initialize first
        r0 = await client.post(f"/interviews/{sample_interview['id']}/messages/first")
        assert r0.status_code == 200
        # First message pair
        r1 = await client.post(
            f"/interviews/{sample_interview['id']}/messages", json={"text": "Hi"}
        )
        assert r1.status_code == 200
        messages1 = r1.json()
        assert (
            len(messages1) == 4
        )  # includes system+assistant greeting (0,1) and new pair (2,3)
        assert [m["index"] for m in messages1] == [0, 1, 2, 3]

        # Second message pair
        r2 = await client.post(
            f"/interviews/{sample_interview['id']}/messages",
            json={"text": "How are you?"},
        )
        assert r2.status_code == 200
        messages2 = r2.json()
        assert len(messages2) == 6
        assert [m["index"] for m in messages2] == [0, 1, 2, 3, 4, 5]
        assert messages2[4]["type"] == "user" and messages2[4]["text"] == "How are you?"
        assert (
            messages2[5]["type"] == "assistant"
            and "Извините, произошла ошибка" in messages2[5]["text"]
        )

    @pytest.mark.asyncio
    async def test_post_missing_text_validation(
        self, client: AsyncClient, sample_interview: dict
    ):
        # Initialize first to avoid 409
        r0 = await client.post(f"/interviews/{sample_interview['id']}/messages/first")
        assert r0.status_code == 200
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

    @pytest.mark.asyncio
    async def test_post_blocked_when_done(
        self, client: AsyncClient, sample_interview: dict
    ):
        # Initialize first
        r0 = await client.post(f"/interviews/{sample_interview['id']}/messages/first")
        assert r0.status_code == 200

        # Mark interview as done via update
        update_payload = {
            "candidate_id": sample_interview["candidate_id"],
            "status": "completed",
            "state": "done",
        }
        r_upd = await client.patch(
            f"/interviews/{sample_interview['id']}", json=update_payload
        )
        assert r_upd.status_code == 200
        assert r_upd.json()["state"] == "done"

        # Now posting should be blocked
        blocked = await client.post(
            f"/interviews/{sample_interview['id']}/messages", json={"text": "Hello"}
        )
        assert blocked.status_code == 409
