import io
import pytest


@pytest.mark.asyncio
async def test_download_candidate_document_flow(client):
    # Upload a minimal PDF to create candidate and store S3 key
    pdf_content = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<<>>endobj\nxref\n0 1\n0000000000 65535 f \ntrailer<<>>\nstartxref\n0\n%%EOF"
    files = {"cv_file": ("cv.pdf", io.BytesIO(pdf_content), "application/pdf")}
    r = await client.post("/candidates/upload-cv", files=files)
    # The parser may require GigaChat; if unavailable, service may fail. Skip if 4xx/5xx
    if r.status_code != 201:
        pytest.skip("Upload requires external GigaChat; skipping document flow test")

    candidate = r.json()
    cid = candidate["id"]

    # Download document
    r2 = await client.get(f"/candidates/{cid}/document")
    assert r2.status_code == 200
    assert r2.headers["content-type"].startswith("application/pdf")
    assert r2.content.startswith(b"%PDF")


@pytest.mark.asyncio
async def test_download_vacancy_document_flow(client):
    # Upload a minimal PDF to create vacancy and store S3 key
    pdf_content = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<<>>endobj\nxref\n0 1\n0000000000 65535 f \ntrailer<<>>\nstartxref\n0\n%%EOF"
    files = {"pdf_file": ("vacancy.pdf", io.BytesIO(pdf_content), "application/pdf")}
    r = await client.post("/vacancies/upload-pdf", files=files)
    if r.status_code != 201:
        pytest.skip("Upload requires external GigaChat; skipping document flow test")

    vacancy = r.json()
    vid = vacancy["id"]

    r2 = await client.get(f"/vacancies/{vid}/document")
    assert r2.status_code == 200
    assert r2.headers["content-type"].startswith("application/pdf")
    assert r2.content.startswith(b"%PDF")
