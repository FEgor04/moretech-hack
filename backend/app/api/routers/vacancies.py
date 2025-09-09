from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Query,
    Response,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import (
    VacancyCreate,
    VacancyRead,
    VacancyUpdate,
    NoteCreate,
    NoteRead,
    NoteUpdate,
)
from app.services import vacancies as vacancies_service
from app.services.exceptions import NotFoundError
from app.services.pdf_parser import (
    get_pdf_parser_service,
    PDFParsingError,
    PDFParserService,
)
from app.clients.s3 import get_s3_client
from app.core.config import settings

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


@router.get("/{vacancy_id}/notes", response_model=list[NoteRead])
async def list_vacancy_notes(
    vacancy_id: int,
    session: AsyncSession = Depends(get_session),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        return await vacancies_service.list_notes(
            session, vacancy_id, limit=limit, offset=offset
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/{vacancy_id}/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED
)
async def create_vacancy_note(
    vacancy_id: int,
    payload: NoteCreate,
    session: AsyncSession = Depends(get_session),
):
    # enforce consistency on vacancy_id
    payload.vacancy_id = vacancy_id
    try:
        return await vacancies_service.create_note(session, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{vacancy_id}/notes/{note_id}", response_model=NoteRead)
async def update_vacancy_note(
    vacancy_id: int,
    note_id: int,
    payload: NoteUpdate,
    session: AsyncSession = Depends(get_session),
):
    try:
        # vacancy_id is not used here beyond route shape; note_id ensures targeting
        return await vacancies_service.update_note(session, note_id, payload)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{vacancy_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vacancy_note(
    vacancy_id: int, note_id: int, session: AsyncSession = Depends(get_session)
):
    try:
        await vacancies_service.delete_note(session, note_id)
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


@router.get("/{vacancy_id}/document")
async def download_vacancy_document(
    vacancy_id: int, session: AsyncSession = Depends(get_session)
):
    logging.getLogger("app").info(
        "[download_vacancy_document] route hit | vacancy_id=%s", vacancy_id
    )
    vacancy = await vacancies_service.get_vacancy(session, vacancy_id)
    if not vacancy:
        logging.getLogger("app").warning(
            "[download_vacancy_document] vacancy not found | vacancy_id=%s",
            vacancy_id,
        )
        raise HTTPException(status_code=404, detail="Vacancy not found")
    if not vacancy.document_s3_key:
        logging.getLogger("app").warning(
            "[download_vacancy_document] document key missing | vacancy_id=%s",
            vacancy_id,
        )
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        logging.getLogger("app").info(
            "[download_vacancy_document] fetching from S3 | bucket=%s key=%s",
            settings.s3_bucket_name,
            vacancy.document_s3_key,
        )
        s3 = get_s3_client()
        obj = s3.get_object(Bucket=settings.s3_bucket_name, Key=vacancy.document_s3_key)
        content = obj["Body"].read()
        logging.getLogger("app").info(
            "[download_vacancy_document] S3 fetch OK | bytes=%s",
            len(content) if hasattr(content, "__len__") else "unknown",
        )
        return Response(content=content, media_type="application/pdf")
    except Exception as e:
        logging.getLogger("app").error(
            "[download_vacancy_document] failed | vacancy_id=%s error=%s",
            vacancy_id,
            e,
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Failed to download document")
