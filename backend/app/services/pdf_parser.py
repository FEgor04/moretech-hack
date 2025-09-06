import json
import logging
from typing import BinaryIO

from app.schemas.common import CandidateCreate, VacancyCreate
from app.clients.gigachat import get_gigachat_client

logger = logging.getLogger(__name__)


class PDFParsingError(Exception):
    """Raised when PDF parsing fails"""

    pass


class PDFParserService:
    """Service for parsing PDF CVs using GigaChat file storage"""

    def __init__(self):
        self.gigachat_client = get_gigachat_client()

    async def parse_cv(self, pdf_file: BinaryIO, filename: str = "resume.pdf") -> tuple[CandidateCreate, str]:
        """Parse PDF CV using GigaChat file storage"""
        try:
            logger.info(f"Starting CV parsing for file: {filename}")
            
            # Upload PDF to GigaChat file storage
            logger.info("Uploading PDF to GigaChat file storage...")
            # Create a file-like object with proper MIME type
            import io
            file_content = pdf_file.read()
            file_obj = io.BytesIO(file_content)
            file_obj.name = filename  # Set filename for proper MIME type detection
            
            file_response = self.gigachat_client.upload_file(file_obj)
            file_id = file_response.id_
            logger.info(f"File uploaded successfully with ID: {file_id}")

            # Create chat completion with file attachment
            logger.info("Sending chat request to GigaChat...")
            result = self.gigachat_client.chat({
                "messages": [
                    {
                        "role": "user",
                        "content": """Проанализируй резюме и извлеки информацию в формате JSON:
{
    "name": "ФИО кандидата",
    "email": "email адрес",
    "position": "желаемая позиция",
    "experience": число лет опыта
}
Отвечай только JSON без дополнительных комментариев.""",
                        "attachments": [file_id]
                    }
                ],
                "temperature": 0.1
            })

            # Parse JSON response
            logger.info("Parsing GigaChat response...")
            response_content = result.choices[0].message.content
            logger.info(f"GigaChat response: {response_content}")
            
            parsed_data = json.loads(response_content)
            logger.info(f"Parsed data: {parsed_data}")

            # Clean and validate email
            email = parsed_data.get("email", "")
            if email and email.strip() and email not in ["не указано", "not specified", "unknown", ""]:
                # Basic email validation - must contain @ and be reasonable length
                if "@" in email and len(email) > 3:
                    clean_email = email.strip()
                else:
                    clean_email = None
            else:
                clean_email = None

            candidate = CandidateCreate(
                name=parsed_data.get("name", "Unknown"),
                email=clean_email,
                position=parsed_data.get("position", "Unknown Position"),
                experience=parsed_data.get("experience", 0),
                status="pending",
                gigachat_file_id=file_id
            )
            
            logger.info(f"Successfully created candidate: {candidate}")
            return candidate, file_id

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Response content: {response_content if 'response_content' in locals() else 'No response content'}")
            raise PDFParsingError(f"Failed to parse JSON response from GigaChat: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during CV parsing: {e}", exc_info=True)
            raise PDFParsingError(f"Failed to parse CV: {e}")

    async def parse_vacancy(self, pdf_file: BinaryIO, filename: str = "vacancy.pdf") -> tuple[VacancyCreate, str]:
        """Parse PDF vacancy using GigaChat file storage"""
        try:
            logger.info(f"Starting vacancy parsing for file: {filename}")
            
            # Upload PDF to GigaChat file storage
            logger.info("Uploading PDF to GigaChat file storage...")
            # Create a file-like object with proper MIME type
            import io
            file_content = pdf_file.read()
            file_obj = io.BytesIO(file_content)
            file_obj.name = filename  # Set filename for proper MIME type detection
            
            file_response = self.gigachat_client.upload_file(file_obj)
            file_id = file_response.id_
            logger.info(f"File uploaded successfully with ID: {file_id}")

            # Create chat completion with file attachment
            logger.info("Sending chat request to GigaChat...")
            result = self.gigachat_client.chat({
                "messages": [
                    {
                        "role": "user",
                        "content": """Проанализируй описание вакансии и извлеки информацию в формате JSON:
{
    "title": "название позиции",
    "description": "описание вакансии"
}
Отвечай только JSON без дополнительных комментариев.""",
                        "attachments": [file_id]
                    }
                ],
                "temperature": 0.1
            })

            # Parse JSON response
            logger.info("Parsing GigaChat response...")
            response_content = result.choices[0].message.content
            logger.info(f"GigaChat response: {response_content}")
            
            parsed_data = json.loads(response_content)
            logger.info(f"Parsed data: {parsed_data}")

            vacancy = VacancyCreate(
                title=parsed_data.get("title", "Unknown Position"),
                description=parsed_data.get("description", "No description available."),
                status="open",
                gigachat_file_id=file_id
            )
            
            logger.info(f"Successfully created vacancy: {vacancy}")
            return vacancy, file_id

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Response content: {response_content if 'response_content' in locals() else 'No response content'}")
            raise PDFParsingError(f"Failed to parse JSON response from GigaChat: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during vacancy parsing: {e}", exc_info=True)
            raise PDFParsingError(f"Failed to parse vacancy: {e}")

    async def analyze_cv_with_gigachat(self, file_id: str, question: str) -> str:
        """
        Analyze a CV using its GigaChat file ID.
        
        Args:
            file_id: GigaChat file ID
            question: Question to ask about the CV
            
        Returns:
            str: GigaChat response
            
        Raises:
            PDFParsingError: If analysis fails
        """
        try:
            result = self.gigachat_client.chat({
                "function_call": "auto",
                "messages": [
                    {
                        "role": "user",
                        "content": question,
                        "attachments": [file_id]
                    }
                ],
                "temperature": 0.1
            })
            
            return result.choices[0].message.content
            
        except Exception as e:
            raise PDFParsingError(f"Failed to analyze CV: {e}")

    async def analyze_vacancy_with_gigachat(self, file_id: str, question: str) -> str:
        """
        Analyze a vacancy using its GigaChat file ID.
        
        Args:
            file_id: GigaChat file ID
            question: Question to ask about the vacancy
            
        Returns:
            str: GigaChat response
            
        Raises:
            PDFParsingError: If analysis fails
        """
        try:
            result = self.gigachat_client.chat({
                "function_call": "auto",
                "messages": [
                    {
                        "role": "user",
                        "content": question,
                        "attachments": [file_id]
                    }
                ],
                "temperature": 0.1
            })
            
            return result.choices[0].message.content
            
        except Exception as e:
            raise PDFParsingError(f"Failed to analyze vacancy: {e}")


def get_pdf_parser_service() -> PDFParserService:
    """Dependency function to get PDF parser service instance"""
    return PDFParserService()
