from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import VacancyCreate, VacancyRead, VacancyUpdate
from app.services import vacancies as vacancies_service
from app.services.exceptions import NotFoundError
from app.services.pdf_parser import (
    get_pdf_parser_service,
    PDFParsingError,
    PDFParserService,
)

router = APIRouter()


@router.post("/", response_model=VacancyRead, status_code=status.HTTP_201_CREATED)
async def create_vacancy(
    payload: VacancyCreate, session: AsyncSession = Depends(get_session)
):
    return await vacancies_service.create_vacancy(session, payload)


@router.get("/", response_model=list[VacancyRead])
async def list_vacancies(session: AsyncSession = Depends(get_session)):
    return await vacancies_service.list_vacancies(session)


@router.get("/{vacancy_id}", response_model=VacancyRead)
async def get_vacancy(vacancy_id: int, session: AsyncSession = Depends(get_session)):
    try:
        return await vacancies_service.get_vacancy(session, vacancy_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{vacancy_id}", response_model=VacancyRead)
async def update_vacancy(
    vacancy_id: int,
    payload: VacancyUpdate,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await vacancies_service.update_vacancy(session, vacancy_id, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vacancy(vacancy_id: int, session: AsyncSession = Depends(get_session)):
    try:
        await vacancies_service.delete_vacancy(session, vacancy_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return None


@router.post(
    "/upload-pdf", response_model=VacancyRead, status_code=status.HTTP_201_CREATED
)
async def upload_vacancy_pdf(
    pdf_file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    pdf_parser: PDFParserService = Depends(get_pdf_parser_service),
):
    """
    Upload a PDF job description and create a vacancy from the parsed information.

    Args:
        pdf_file: PDF file containing the job description
        session: Database session

    Returns:
        VacancyRead: Created vacancy with parsed information

    Raises:
        HTTPException: If file is not a PDF or parsing fails
    """
    # Validate file type
    if not pdf_file.content_type or not pdf_file.content_type.startswith(
        "application/pdf"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a PDF"
        )

    try:
        # Parse the PDF to extract vacancy information
        vacancy_data, file_id = await pdf_parser.parse_vacancy(
            pdf_file.file, pdf_file.filename or "vacancy.pdf"
        )

        # Create the vacancy using the existing service
        vacancy = await vacancies_service.create_vacancy(session, vacancy_data)

        return vacancy

    except PDFParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse job description: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the job description: {str(e)}",
        )
