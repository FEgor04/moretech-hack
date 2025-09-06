from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import CandidateCreate, CandidateRead
from app.services import candidates as candidates_service
from app.services.exceptions import NotFoundError
from app.services.pdf_parser import get_pdf_parser_service, PDFParsingError, PDFParserService

router = APIRouter()


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


@router.post("/upload-cv", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def upload_cv(
    cv_file: UploadFile = File(...), 
    session: AsyncSession = Depends(get_session),
    pdf_parser: PDFParserService = Depends(get_pdf_parser_service)
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
    # Validate file type
    if not cv_file.content_type or not cv_file.content_type.startswith("application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF"
        )
    
    try:
        # Parse the PDF to extract candidate information
        candidate_data = await pdf_parser.parse_cv(cv_file.file)
        
        # Create the candidate using the existing service
        candidate = await candidates_service.create_candidate(session, candidate_data)
        
        return candidate
        
    except PDFParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse CV: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the CV: {str(e)}"
        )
