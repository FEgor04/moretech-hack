import logging
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Response,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import CandidateCreate, CandidateRead
from app.services import candidates as candidates_service
from app.services.exceptions import NotFoundError
from app.services.pdf_parser import (
    get_pdf_parser_service,
    PDFParsingError,
    PDFParserService,
)
from app.clients.s3 import get_s3_client
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/test-gigachat")
async def test_gigachat_connection():
    """Test GigaChat API connectivity"""
    try:
        logger.info("Testing GigaChat connection...")
        pdf_parser = get_pdf_parser_service()

        # Test basic chat without file
        result = pdf_parser.gigachat_client.chat(
            {
                "messages": [
                    {"role": "user", "content": "Привет! Это тест подключения."}
                ],
                "temperature": 0.1,
            }
        )

        logger.info("GigaChat connection test successful")
        return {
            "status": "success",
            "message": "GigaChat connection is working",
            "response": result.choices[0].message.content,
        }
    except Exception as e:
        logger.error(f"GigaChat connection test failed: {e}", exc_info=True)
        return {"status": "error", "message": f"GigaChat connection failed: {str(e)}"}


@router.post("/", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: CandidateCreate, session: AsyncSession = Depends(get_session)
):
    return await candidates_service.create_candidate(session, payload)


@router.get("/", response_model=list[CandidateRead])
async def list_candidates(session: AsyncSession = Depends(get_session)):
    return await candidates_service.list_candidates(session)


@router.get("/{candidate_id}", response_model=CandidateRead)
async def get_candidate(
    candidate_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        return await candidates_service.get_candidate(session, candidate_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{candidate_id}", response_model=CandidateRead)
async def update_candidate(
    candidate_id: str,
    payload: CandidateCreate,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await candidates_service.update_candidate(session, candidate_id, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: str, session: AsyncSession = Depends(get_session)
):
    try:
        await candidates_service.delete_candidate(session, candidate_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None


@router.post(
    "/upload-cv", response_model=CandidateRead, status_code=status.HTTP_201_CREATED
)
async def upload_cv(
    cv_file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    pdf_parser: PDFParserService = Depends(get_pdf_parser_service),
):
    """
    Upload a PDF CV and create a candidate from the parsed information.

    Args:
        cv_file: PDF file containing the candidate's CV
        session: Database session

    Returns:
        CandidateRead: Created candidate with parsed information

    Raises:
        HTTPException: If file is not a PDF or parsing fails
    """
    logger.info(f"Received CV upload request for file: {cv_file.filename}")
    logger.info(f"File content type: {cv_file.content_type}")
    logger.info(f"File size: {cv_file.size if hasattr(cv_file, 'size') else 'Unknown'}")

    # Validate file type
    if not cv_file.content_type or not cv_file.content_type.startswith(
        "application/pdf"
    ):
        logger.error(f"Invalid file type: {cv_file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a PDF"
        )

    try:
        logger.info("Starting CV parsing process...")
        # Parse the PDF to extract candidate information
        candidate_data, file_id = await pdf_parser.parse_cv(
            cv_file.file, cv_file.filename or "resume.pdf"
        )
        logger.info(f"CV parsing completed successfully. File ID: {file_id}")

        logger.info("Creating candidate in database...")
        # Create the candidate using the existing service
        candidate = await candidates_service.create_candidate(session, candidate_data)
        logger.info(f"Candidate created successfully with ID: {candidate.id}")

        return candidate

    except PDFParsingError as e:
        logger.error(f"PDF parsing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse CV: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected error during CV upload: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the CV: {str(e)}",
        )


@router.get("/{candidate_id}/document")
async def download_candidate_document(
    candidate_id: str, session: AsyncSession = Depends(get_session)
):
    candidate = await candidates_service.get_candidate(session, candidate_id)
    if not candidate or not candidate.document_s3_key:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        s3 = get_s3_client()
        obj = s3.get_object(
            Bucket=settings.s3_bucket_name, Key=candidate.document_s3_key
        )
        content = obj["Body"].read()
        return Response(content=content, media_type="application/pdf")
    except Exception as e:
        logger.error(f"Failed to download candidate document: {e}")
        raise HTTPException(status_code=500, detail="Failed to download document")
