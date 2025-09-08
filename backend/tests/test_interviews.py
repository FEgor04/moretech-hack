import pytest
import uuid
from httpx import AsyncClient


@pytest.fixture
async def sample_candidate(client: AsyncClient) -> dict:
    """Create a sample candidate for testing."""
    candidate_data = {
        "name": "John Doe",
        "email": "john@example.com",
        "position": "Software Engineer",
        "experience_years": 3,
    }
    response = await client.post("/candidates/", json=candidate_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
async def sample_vacancy(client: AsyncClient) -> dict:
    """Create a sample vacancy for testing."""
    vacancy_data = {
        "title": "Senior Developer",
        "description": "Looking for a senior developer",
        "status": "open",
    }
    response = await client.post("/vacancies/", json=vacancy_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
async def sample_interview_data(sample_candidate: dict, sample_vacancy: dict) -> dict:
    """Create sample interview data for testing."""
    return {
        "candidate_id": sample_candidate["id"],
        "vacancy_id": sample_vacancy["id"],
        "transcript": "Test interview transcript",
        "recording_url": "https://example.com/recording.mp3",
        "status": "scheduled",
    }


class TestCreateInterview:
    """Test cases for creating interviews via REST API."""

    @pytest.mark.asyncio
    async def test_create_interview_with_valid_uuid_candidate_id(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test creating an interview with a valid UUID candidate_id."""
        response = await client.post("/interviews/", json=sample_interview_data)

        assert response.status_code == 201
        interview = response.json()

        assert "id" in interview
        assert interview["candidate_id"] == sample_interview_data["candidate_id"]
        assert interview["vacancy_id"] == sample_interview_data["vacancy_id"]
        assert interview["transcript"] == sample_interview_data["transcript"]
        assert interview["recording_url"] == sample_interview_data["recording_url"]
        assert "created_at" in interview
        assert "updated_at" in interview

    @pytest.mark.asyncio
    async def test_create_interview_with_invalid_uuid_candidate_id(
        self, client: AsyncClient, sample_vacancy: dict
    ):
        """Test creating an interview with an invalid UUID candidate_id."""
        invalid_interview_data = {
            "candidate_id": "invalid-uuid",
            "vacancy_id": sample_vacancy["id"],
            "status": "scheduled",
        }

        response = await client.post("/interviews/", json=invalid_interview_data)
        assert response.status_code == 422  # Validation error from Pydantic
        # Pydantic will return detailed validation errors
        detail = response.json()["detail"]
        assert any("candidate_id" in str(error) for error in detail)

    @pytest.mark.asyncio
    async def test_create_interview_with_nonexistent_candidate_id(
        self, client: AsyncClient, sample_vacancy: dict
    ):
        """Test creating an interview with a nonexistent candidate_id."""
        nonexistent_uuid = str(uuid.uuid4())
        interview_data = {
            "candidate_id": nonexistent_uuid,
            "vacancy_id": sample_vacancy["id"],
            "status": "scheduled",
        }

        response = await client.post("/interviews/", json=interview_data)
        assert response.status_code == 400  # Bad request due to foreign key constraint
        assert "Invalid candidate_id or vacancy_id" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_interview_with_minimal_data(
        self, client: AsyncClient, sample_candidate: dict
    ):
        """Test creating an interview with minimal required data."""
        minimal_data = {
            "candidate_id": sample_candidate["id"],
            "status": "scheduled",
        }

        response = await client.post("/interviews/", json=minimal_data)
        assert response.status_code == 201

        interview = response.json()
        assert "id" in interview
        assert interview["candidate_id"] == sample_candidate["id"]
        assert interview["vacancy_id"] is None
        assert interview["transcript"] is None
        assert interview["recording_url"] is None

    @pytest.mark.asyncio
    async def test_create_interview_missing_required_fields(self, client: AsyncClient):
        """Test creating an interview with missing required fields."""
        # Missing candidate_id
        response = await client.post("/interviews/", json={"status": "scheduled"})
        assert response.status_code == 422  # Validation error


class TestListInterviews:
    """Test cases for listing interviews via REST API."""

    @pytest.mark.asyncio
    async def test_list_interviews_empty(self, client: AsyncClient):
        """Test listing interviews when none exist."""
        response = await client.get("/interviews/")
        assert response.status_code == 200
        interviews = response.json()
        # Note: Due to test isolation issues, we can't guarantee empty list
        # but we can verify the response structure
        assert isinstance(interviews, list)

    @pytest.mark.asyncio
    async def test_list_interviews_with_data(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test listing interviews when data exists."""
        # Get initial count
        initial_response = await client.get("/interviews/")
        assert initial_response.status_code == 200
        initial_interviews = initial_response.json()
        initial_count = len(initial_interviews)

        # Create multiple interviews
        response1 = await client.post("/interviews/", json=sample_interview_data)
        assert response1.status_code == 201
        interview1 = response1.json()

        # Create another interview with different data
        interview2_data = {
            "candidate_id": sample_interview_data["candidate_id"],
            "status": "completed",
        }
        response2 = await client.post("/interviews/", json=interview2_data)
        assert response2.status_code == 201
        interview2 = response2.json()

        # List all interviews
        response = await client.get("/interviews/")
        assert response.status_code == 200
        interviews = response.json()

        # Should have at least 2 more interviews than initially
        assert len(interviews) >= initial_count + 2
        interview_ids = [interview["id"] for interview in interviews]
        assert interview1["id"] in interview_ids
        assert interview2["id"] in interview_ids


class TestGetInterviewsByCandidate:
    """Test cases for getting interviews by candidate ID via REST API."""

    @pytest.mark.asyncio
    async def test_get_interviews_by_candidate_empty(
        self, client: AsyncClient, sample_candidate: dict
    ):
        """Test getting interviews for a candidate with no interviews."""
        response = await client.get(f"/interviews/candidate/{sample_candidate['id']}")
        assert response.status_code == 200
        interviews = response.json()
        assert interviews == []

    @pytest.mark.asyncio
    async def test_get_interviews_by_candidate_with_data(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test getting interviews for a candidate with interviews."""
        # Create multiple interviews for the same candidate
        response1 = await client.post("/interviews/", json=sample_interview_data)
        assert response1.status_code == 201
        interview1 = response1.json()

        interview2_data = {
            "candidate_id": sample_interview_data["candidate_id"],
            "status": "completed",
        }
        response2 = await client.post("/interviews/", json=interview2_data)
        assert response2.status_code == 201
        interview2 = response2.json()

        # Create interview for different candidate
        other_candidate_data = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "position": "Designer",
            "experience_years": 2,
        }
        other_candidate_response = await client.post(
            "/candidates/", json=other_candidate_data
        )
        assert other_candidate_response.status_code == 201
        other_candidate = other_candidate_response.json()

        other_interview_data = {
            "candidate_id": other_candidate["id"],
            "status": "scheduled",
        }
        await client.post("/interviews/", json=other_interview_data)

        # Get interviews for the first candidate
        response = await client.get(
            f"/interviews/candidate/{sample_interview_data['candidate_id']}"
        )
        assert response.status_code == 200
        candidate_interviews = response.json()

        assert len(candidate_interviews) == 2
        interview_ids = [interview["id"] for interview in candidate_interviews]
        assert interview1["id"] in interview_ids
        assert interview2["id"] in interview_ids
        # Should be ordered by created_at desc
        assert (
            candidate_interviews[0]["created_at"]
            >= candidate_interviews[1]["created_at"]
        )

    @pytest.mark.asyncio
    async def test_get_interviews_by_candidate_invalid_uuid(self, client: AsyncClient):
        """Test getting interviews with invalid UUID candidate_id."""
        response = await client.get("/interviews/candidate/invalid-uuid")
        assert response.status_code == 200
        interviews = response.json()
        assert interviews == []

    @pytest.mark.asyncio
    async def test_get_interviews_by_candidate_nonexistent_uuid(
        self, client: AsyncClient
    ):
        """Test getting interviews with nonexistent UUID candidate_id."""
        nonexistent_uuid = str(uuid.uuid4())
        response = await client.get(f"/interviews/candidate/{nonexistent_uuid}")
        assert response.status_code == 200
        interviews = response.json()
        assert interviews == []


class TestGetInterview:
    """Test cases for getting a single interview via REST API."""

    @pytest.mark.asyncio
    async def test_get_interview_existing(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test getting an existing interview."""
        create_response = await client.post("/interviews/", json=sample_interview_data)
        assert create_response.status_code == 201
        created_interview = create_response.json()

        get_response = await client.get(f"/interviews/{created_interview['id']}")
        assert get_response.status_code == 200
        retrieved_interview = get_response.json()

        assert retrieved_interview["id"] == created_interview["id"]
        assert retrieved_interview["candidate_id"] == created_interview["candidate_id"]
        assert retrieved_interview["vacancy_id"] == created_interview["vacancy_id"]
        assert retrieved_interview["transcript"] == created_interview["transcript"]
        assert (
            retrieved_interview["recording_url"] == created_interview["recording_url"]
        )

    @pytest.mark.asyncio
    async def test_get_interview_nonexistent(self, client: AsyncClient):
        """Test getting a nonexistent interview."""
        nonexistent_id = str(uuid.uuid4())
        response = await client.get(f"/interviews/{nonexistent_id}")
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]


class TestUpdateInterview:
    """Test cases for updating interviews via REST API."""

    @pytest.mark.asyncio
    async def test_update_interview_existing(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test updating an existing interview."""
        create_response = await client.post("/interviews/", json=sample_interview_data)
        assert create_response.status_code == 201
        created_interview = create_response.json()

        update_data = {
            "candidate_id": created_interview["candidate_id"],
            "status": "completed",
            "transcript": "Updated transcript",
        }

        update_response = await client.patch(
            f"/interviews/{created_interview['id']}", json=update_data
        )
        assert update_response.status_code == 200
        updated_interview = update_response.json()

        assert updated_interview["id"] == created_interview["id"]
        assert updated_interview["candidate_id"] == created_interview["candidate_id"]
        assert updated_interview["transcript"] == "Updated transcript"
        assert (
            updated_interview["recording_url"] == created_interview["recording_url"]
        )  # Should remain unchanged

    @pytest.mark.asyncio
    async def test_update_interview_nonexistent(
        self, client: AsyncClient, sample_candidate: dict
    ):
        """Test updating a nonexistent interview."""
        update_data = {
            "candidate_id": sample_candidate["id"],
            "status": "completed",
        }

        nonexistent_id = str(uuid.uuid4())
        response = await client.patch(f"/interviews/{nonexistent_id}", json=update_data)
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_update_interview_partial_data(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test updating an interview with partial data."""
        create_response = await client.post("/interviews/", json=sample_interview_data)
        assert create_response.status_code == 201
        created_interview = create_response.json()

        # Update only status, other fields should remain unchanged
        update_data = {
            "candidate_id": created_interview["candidate_id"],
            "status": "completed",
        }

        update_response = await client.patch(
            f"/interviews/{created_interview['id']}", json=update_data
        )
        assert update_response.status_code == 200
        updated_interview = update_response.json()

        assert updated_interview["transcript"] == created_interview["transcript"]
        assert updated_interview["recording_url"] == created_interview["recording_url"]
        assert updated_interview["vacancy_id"] == created_interview["vacancy_id"]


class TestDeleteInterview:
    """Test cases for deleting interviews via REST API."""

    @pytest.mark.asyncio
    async def test_delete_interview_existing(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test deleting an existing interview."""
        create_response = await client.post("/interviews/", json=sample_interview_data)
        assert create_response.status_code == 201
        created_interview = create_response.json()

        delete_response = await client.delete(f"/interviews/{created_interview['id']}")
        assert delete_response.status_code == 204

        # Verify interview is deleted
        get_response = await client.get(f"/interviews/{created_interview['id']}")
        assert get_response.status_code == 404
        assert "Interview not found" in get_response.json()["detail"]

    @pytest.mark.asyncio
    async def test_delete_interview_nonexistent(self, client: AsyncClient):
        """Test deleting a nonexistent interview."""
        nonexistent_id = str(uuid.uuid4())
        response = await client.delete(f"/interviews/{nonexistent_id}")
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]


class TestInterviewUUIDValidation:
    """Test cases for UUID validation in interview operations via REST API."""

    @pytest.mark.asyncio
    async def test_candidate_id_uuid_format_validation(
        self, client: AsyncClient, sample_vacancy: dict
    ):
        """Test that candidate_id must be a valid UUID format."""
        # Test with various invalid UUID formats
        invalid_uuids = [
            "not-a-uuid",
            "123",
            "uuid-without-dashes",
            "00000000-0000-0000-0000-000000000000",  # Valid format but might not exist
        ]

        for invalid_uuid in invalid_uuids:
            interview_data = {
                "candidate_id": invalid_uuid,
                "vacancy_id": sample_vacancy["id"],
                "status": "scheduled",
            }

            response = await client.post("/interviews/", json=interview_data)
            # For invalid UUID formats, we get Pydantic validation error (422)
            # For valid UUID formats that don't exist, we get foreign key constraint error (400)
            if invalid_uuid == "00000000-0000-0000-0000-000000000000":
                # Valid UUID format but doesn't exist - should get foreign key constraint error
                assert response.status_code == 400
                assert "Invalid candidate_id or vacancy_id" in response.json()["detail"]
            else:
                # Invalid UUID format - should get Pydantic validation error
                assert response.status_code == 422
                detail = response.json()["detail"]
                assert any("candidate_id" in str(error) for error in detail)

    @pytest.mark.asyncio
    async def test_candidate_id_string_type_handling(
        self, client: AsyncClient, sample_candidate: dict, sample_vacancy: dict
    ):
        """Test that candidate_id is properly handled as string UUID."""
        interview_data = {
            "candidate_id": sample_candidate["id"],  # This is already a string UUID
            "vacancy_id": sample_vacancy["id"],
            "status": "scheduled",
        }

        create_response = await client.post("/interviews/", json=interview_data)
        assert create_response.status_code == 201
        interview = create_response.json()

        # Verify the candidate_id is stored and retrieved as string
        assert isinstance(interview["candidate_id"], str)
        assert len(interview["candidate_id"]) == 36  # Standard UUID length
        assert interview["candidate_id"] == sample_candidate["id"]

        # Verify we can retrieve interviews by this UUID string
        get_response = await client.get(
            f"/interviews/candidate/{sample_candidate['id']}"
        )
        assert get_response.status_code == 200
        candidate_interviews = get_response.json()
        assert len(candidate_interviews) == 1
        assert candidate_interviews[0]["candidate_id"] == sample_candidate["id"]

    @pytest.mark.asyncio
    async def test_candidate_id_uuid_validation_in_update(
        self, client: AsyncClient, sample_interview_data: dict
    ):
        """Test UUID validation when updating interviews."""
        # Create an interview first
        create_response = await client.post("/interviews/", json=sample_interview_data)
        assert create_response.status_code == 201
        created_interview = create_response.json()

        # Try to update with invalid UUID
        invalid_update_data = {
            "candidate_id": "invalid-uuid",
            "status": "completed",
        }

        update_response = await client.patch(
            f"/interviews/{created_interview['id']}", json=invalid_update_data
        )
        assert update_response.status_code == 422  # Validation error from Pydantic
        # Pydantic will return detailed validation errors
        detail = update_response.json()["detail"]
        assert any("candidate_id" in str(error) for error in detail)
