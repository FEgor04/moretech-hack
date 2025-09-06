import io
import pytest


@pytest.mark.skip(reason="GigaChat credentials are not configured")
@pytest.mark.asyncio
async def test_upload_vacancy_pdf_success(client):
    """Test successful vacancy PDF upload and vacancy creation"""
    # Create a mock PDF file content
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Senior Software Engineer Job Description) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF"

    # Create a file-like object
    pdf_file = io.BytesIO(pdf_content)

    # Upload the PDF
    files = {"pdf_file": ("job_description.pdf", pdf_file, "application/pdf")}
    response = await client.post("/vacancies/upload-pdf", files=files)

    # Assert successful response
    assert response.status_code == 201

    # Check the response data
    vacancy_data = response.json()
    assert "id" in vacancy_data
    assert vacancy_data["title"] == "Senior Software Engineer"
    assert (
        vacancy_data["description"]
        == "We are looking for a Senior Software Engineer to join our team. The ideal candidate will have 5+ years of experience in software development, strong problem-solving skills, and experience with modern web technologies."
    )
    assert vacancy_data["status"] == "open"
    assert "created_at" in vacancy_data
    assert "updated_at" in vacancy_data


@pytest.mark.skip(reason="GigaChat credentials are not configured")
@pytest.mark.asyncio
async def test_upload_vacancy_pdf_invalid_file_type(client):
    """Test vacancy PDF upload with invalid file type"""
    # Create a non-PDF file content
    text_content = b"This is not a PDF file"

    # Create a file-like object
    text_file = io.BytesIO(text_content)

    # Upload the file
    files = {"pdf_file": ("job_description.txt", text_file, "text/plain")}
    response = await client.post("/vacancies/upload-pdf", files=files)

    # Assert error response
    assert response.status_code == 400
    assert "File must be a PDF" in response.json()["detail"]


@pytest.mark.skip(reason="GigaChat credentials are not configured")
@pytest.mark.asyncio
async def test_upload_vacancy_pdf_no_file(client):
    """Test vacancy PDF upload without file"""
    response = await client.post("/vacancies/upload-pdf")

    # Assert error response
    assert response.status_code == 422  # Validation error


@pytest.mark.skip(reason="GigaChat credentials are not configured")
@pytest.mark.asyncio
async def test_upload_vacancy_pdf_empty_file(client):
    """Test vacancy PDF upload with empty file"""
    # Create an empty file
    empty_file = io.BytesIO(b"")

    # Upload the empty file
    files = {"pdf_file": ("empty.pdf", empty_file, "application/pdf")}
    response = await client.post("/vacancies/upload-pdf", files=files)

    # Should still work with our mock implementation
    assert response.status_code == 201

    # Check the response data
    vacancy_data = response.json()
    assert "id" in vacancy_data
    assert vacancy_data["title"] == "Senior Software Engineer"  # Mock data


@pytest.mark.skip(reason="GigaChat credentials are not configured")
@pytest.mark.asyncio
async def test_upload_vacancy_pdf_creates_vacancy_in_db(client, db_session):
    """Test that uploaded PDF creates a vacancy in the database"""
    from app.models.vacancy import Vacancy
    from sqlalchemy import select

    # Create a mock PDF file content
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Senior Software Engineer Job Description) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF"

    # Create a file-like object
    pdf_file = io.BytesIO(pdf_content)

    # Upload the PDF
    files = {"pdf_file": ("job_description.pdf", pdf_file, "application/pdf")}
    response = await client.post("/vacancies/upload-pdf", files=files)

    # Assert successful response
    assert response.status_code == 201
    vacancy_data = response.json()
    vacancy_id = vacancy_data["id"]

    # Verify the vacancy was created in the database
    result = await db_session.execute(select(Vacancy).where(Vacancy.id == vacancy_id))
    vacancy = result.scalar_one_or_none()

    assert vacancy is not None
    assert vacancy.title == "Senior Software Engineer"
    assert (
        vacancy.description
        == "We are looking for a Senior Software Engineer to join our team. The ideal candidate will have 5+ years of experience in software development, strong problem-solving skills, and experience with modern web technologies."
    )
    assert vacancy.status == "open"
