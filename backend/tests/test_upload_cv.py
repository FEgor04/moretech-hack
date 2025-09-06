import io
import pytest


@pytest.mark.asyncio
async def test_upload_cv_success(client):
    """Test successful CV upload and candidate creation"""
    # Create a mock PDF file content
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(John Doe CV) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF"

    # Create a file-like object
    pdf_file = io.BytesIO(pdf_content)

    # Upload the CV
    files = {"cv_file": ("test_cv.pdf", pdf_file, "application/pdf")}
    response = await client.post("/candidates/upload-cv", files=files)

    # Assert successful response
    assert response.status_code == 201

    # Check the response data
    candidate_data = response.json()
    assert "id" in candidate_data
    assert candidate_data["name"] == "John Doe"
    assert candidate_data["email"] == "john.doe@example.com"
    assert candidate_data["position"] == "Software Engineer"
    assert candidate_data["experience"] == 5
    assert candidate_data["status"] == "pending"
    assert "created_at" in candidate_data
    assert "updated_at" in candidate_data


@pytest.mark.asyncio
async def test_upload_cv_invalid_file_type(client):
    """Test CV upload with invalid file type"""
    # Create a non-PDF file content
    text_content = b"This is not a PDF file"

    # Create a file-like object
    text_file = io.BytesIO(text_content)

    # Upload the file
    files = {"cv_file": ("test.txt", text_file, "text/plain")}
    response = await client.post("/candidates/upload-cv", files=files)

    # Assert error response
    assert response.status_code == 400
    assert "File must be a PDF" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_cv_no_file(client):
    """Test CV upload without file"""
    response = await client.post("/candidates/upload-cv")

    # Assert error response
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_upload_cv_empty_file(client):
    """Test CV upload with empty file"""
    # Create an empty file
    empty_file = io.BytesIO(b"")

    # Upload the empty file
    files = {"cv_file": ("empty.pdf", empty_file, "application/pdf")}
    response = await client.post("/candidates/upload-cv", files=files)

    # Should still work with our mock implementation
    assert response.status_code == 201

    # Check the response data
    candidate_data = response.json()
    assert "id" in candidate_data
    assert candidate_data["name"] == "John Doe"  # Mock data


@pytest.mark.asyncio
async def test_upload_cv_creates_candidate_in_db(client, db_session):
    """Test that uploaded CV creates a candidate in the database"""
    from app.models.candidate import Candidate
    from sqlalchemy import select

    # Create a mock PDF file content
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(John Doe CV) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF"

    # Create a file-like object
    pdf_file = io.BytesIO(pdf_content)

    # Upload the CV
    files = {"cv_file": ("test_cv.pdf", pdf_file, "application/pdf")}
    response = await client.post("/candidates/upload-cv", files=files)

    # Assert successful response
    assert response.status_code == 201
    candidate_data = response.json()
    candidate_id = candidate_data["id"]

    # Verify the candidate was created in the database
    result = await db_session.execute(
        select(Candidate).where(Candidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()

    assert candidate is not None
    assert candidate.name == "John Doe"
    assert candidate.email == "john.doe@example.com"
    assert candidate.position == "Software Engineer"
    assert candidate.experience == 5
    assert candidate.status == "pending"
