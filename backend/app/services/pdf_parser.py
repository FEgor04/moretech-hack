import json
import logging
from typing import BinaryIO

from app.schemas.common import (
    CandidateCreate,
    VacancyCreate,
    ExperienceItem,
    EducationItem,
    EmploymentType,
    ExperienceLevel,
)
from app.schemas.parsing import CVParsingSchema, VacancyParsingSchema
from app.clients.gigachat import get_gigachat_client

logger = logging.getLogger(__name__)


class PDFParsingError(Exception):
    """Raised when PDF parsing fails"""

    pass


class PDFParserService:
    """Service for parsing PDF CVs using GigaChat file storage"""

    def __init__(self):
        self.gigachat_client = get_gigachat_client()

    def _normalize_blank_fields(self, data: dict) -> dict:
        """Normalize blank/empty fields to None values"""
        blank_values = [
            "",
            " ",
            "  ",
            "\n",
            "\t",
            "null",
            "NULL",
            "None",
            "none",
            "не указано",
            "не указан",
            "не указана",
            "не указаны",
            "not specified",
            "unknown",
            "нет информации",
            "нет данных",
            "N/A",
            "n/a",
            "—",
            "–",
            "-",
            "отсутствует",
        ]

        normalized_data = {}
        for key, value in data.items():
            if value is None:
                normalized_data[key] = None
            elif isinstance(value, str):
                # Check if string is blank or contains only whitespace
                if value.strip() in blank_values or not value.strip():
                    normalized_data[key] = None
                else:
                    normalized_data[key] = value.strip()
            elif isinstance(value, list):
                # For lists, filter out blank items
                if not value:
                    normalized_data[key] = None
                else:
                    filtered_list = []
                    for item in value:
                        if isinstance(item, str):
                            if item.strip() not in blank_values and item.strip():
                                filtered_list.append(item.strip())
                        else:
                            filtered_list.append(item)
                    normalized_data[key] = filtered_list if filtered_list else None
            else:
                normalized_data[key] = value

        return normalized_data

    def _get_cv_json_schema(self) -> str:
        """Generate JSON schema for CV parsing"""
        schema = CVParsingSchema.model_json_schema()
        return json.dumps(schema, ensure_ascii=False, indent=2)

    def _get_vacancy_json_schema(self) -> str:
        """Generate JSON schema for vacancy parsing"""
        schema = VacancyParsingSchema.model_json_schema()
        return json.dumps(schema, ensure_ascii=False, indent=2)

    async def parse_cv(
        self, pdf_file: BinaryIO, filename: str = "resume.pdf"
    ) -> tuple[CandidateCreate, str]:
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

            # Generate JSON schema for precise parsing
            json_schema = self._get_cv_json_schema()

            result = self.gigachat_client.chat(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""Проанализируй резюме и извлеки всю доступную информацию в точном соответствии с JSON схемой.

ВАЖНО: 
- Извлекай ВСЕ доступные данные, не оставляй поля пустыми без веской причины
- Следуй инструкциям в описаниях полей JSON схемы
- Если поле не найдено, используй null, но старайся найти максимум информации

JSON схема с подробными инструкциями:
{json_schema}

Отвечай ТОЛЬКО валидным JSON без дополнительных комментариев или объяснений.""",
                            "attachments": [file_id],
                        }
                    ],
                    "temperature": 0.1,
                }
            )

            # Parse JSON response
            logger.info("Parsing GigaChat response...")
            response_content = result.choices[0].message.content
            logger.info(f"GigaChat response: {response_content}")

            # Clean JSON response from invisible Unicode characters
            import re

            cleaned_content = re.sub(r"[\u200b-\u200d\ufeff]", "", response_content)

            # Parse and validate with Pydantic schema
            parsed_data = json.loads(cleaned_content)
            logger.info(f"Parsed data: {parsed_data}")

            # Normalize blank fields to None
            parsed_data = self._normalize_blank_fields(parsed_data)
            logger.info(f"Normalized data: {parsed_data}")

            # Validate with Pydantic schema
            try:
                validated_data = CVParsingSchema.model_validate(parsed_data)
                logger.info(f"Validated data: {validated_data}")
                # Use validated data for further processing
                parsed_data = validated_data.model_dump()
            except Exception as e:
                logger.warning(f"Schema validation failed, using raw data: {e}")

            # Clean and validate email
            email = parsed_data.get("email")
            if email and "@" in email and len(email) > 3:
                clean_email = email.strip()
            else:
                clean_email = None

            # Get normalized values
            name = parsed_data.get("name")
            position = parsed_data.get("position")

            # Convert employment_type string to enum
            employment_type = None
            if parsed_data.get("employment_type"):
                employment_type_str = parsed_data.get("employment_type").lower()
                # Map to enum values
                if employment_type_str == "полная занятость":
                    employment_type = EmploymentType.FULL_TIME
                elif employment_type_str == "частичная занятость":
                    employment_type = EmploymentType.PART_TIME
                elif employment_type_str == "контракт":
                    employment_type = EmploymentType.CONTRACT
                elif employment_type_str == "стажировка":
                    employment_type = EmploymentType.INTERNSHIP

            # Convert experience list to ExperienceItem objects
            experience_list = parsed_data.get("experience", [])
            if experience_list:
                try:
                    experience_items = []
                    for exp in experience_list:
                        if isinstance(exp, dict):
                            # Normalize years to int
                            years = exp.get("years", 0)
                            if isinstance(years, float):
                                years = int(round(years))
                            experience_items.append(
                                ExperienceItem(
                                    company=exp.get("company", "Unknown Company"),
                                    position=exp.get("position", "Unknown Position"),
                                    years=years,
                                )
                            )
                    experience = experience_items if experience_items else None
                except Exception as e:
                    logger.warning(f"Failed to parse experience items: {e}")
                    experience = None
            else:
                experience = None

            # Convert education list to EducationItem objects
            education_list = parsed_data.get("education", [])
            if education_list:
                try:
                    education_items = []
                    for edu in education_list:
                        if isinstance(edu, dict):
                            education_items.append(
                                EducationItem(
                                    organization=edu.get(
                                        "organization", "Unknown Organization"
                                    ),
                                    speciality=edu.get(
                                        "speciality", "Unknown Speciality"
                                    ),
                                    type=edu.get("type"),
                                )
                            )
                    education = education_items if education_items else None
                except Exception as e:
                    logger.warning(f"Failed to parse education items: {e}")
                    education = None
            else:
                education = None

            candidate = CandidateCreate(
                name=name,
                email=clean_email,
                position=position,
                experience=experience,
                status="pending",
                gigachat_file_id=file_id,
                skills=parsed_data.get("skills"),
                tech=parsed_data.get("tech"),
                education=education,
                geo=parsed_data.get("geo"),
                employment_type=employment_type,
            )

            logger.info(f"Successfully created candidate: {candidate}")
            return candidate, file_id

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(
                f"Response content: {response_content if 'response_content' in locals() else 'No response content'}"
            )
            raise PDFParsingError(f"Failed to parse JSON response from GigaChat: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during CV parsing: {e}", exc_info=True)
            raise PDFParsingError(f"Failed to parse CV: {e}")

    async def parse_vacancy(
        self, pdf_file: BinaryIO, filename: str = "vacancy.pdf"
    ) -> tuple[VacancyCreate, str]:
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

            # Generate JSON schema for precise parsing
            json_schema = self._get_vacancy_json_schema()

            result = self.gigachat_client.chat(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""Проанализируй описание вакансии и извлеки всю доступную информацию в точном соответствии с JSON схемой.

ВАЖНО:
- Извлекай ВСЕ доступные данные, не оставляй поля пустыми без веской причины
- Следуй инструкциям в описаниях полей JSON схемы
- Если поле не найдено, используй null, но старайся найти максимум информации

JSON схема с подробными инструкциями:
{json_schema}

Отвечай ТОЛЬКО валидным JSON без дополнительных комментариев или объяснений.""",
                            "attachments": [file_id],
                        }
                    ],
                    "temperature": 0.1,
                }
            )

            # Parse JSON response
            logger.info("Parsing GigaChat response...")
            response_content = result.choices[0].message.content
            logger.info(f"GigaChat response: {response_content}")

            # Clean JSON response from invisible Unicode characters
            import re

            cleaned_content = re.sub(r"[\u200b-\u200d\ufeff]", "", response_content)

            # Parse and validate with Pydantic schema
            parsed_data = json.loads(cleaned_content)
            logger.info(f"Parsed data: {parsed_data}")

            # Normalize blank fields to None
            parsed_data = self._normalize_blank_fields(parsed_data)
            logger.info(f"Normalized data: {parsed_data}")

            # Fix common validation issues AFTER normalization
            # minor_skills will now be handled by the validator to return [] instead of None

            # Convert employment_type string to enum
            employment_type = None
            if parsed_data.get("employment_type"):
                employment_type_str = parsed_data.get("employment_type").lower()
                # Map to enum values
                if employment_type_str == "полная занятость":
                    employment_type = EmploymentType.FULL_TIME
                elif employment_type_str == "частичная занятость":
                    employment_type = EmploymentType.PART_TIME
                elif employment_type_str == "контракт":
                    employment_type = EmploymentType.CONTRACT
                elif employment_type_str == "стажировка":
                    employment_type = EmploymentType.INTERNSHIP
                parsed_data["employment_type"] = employment_type

            # Convert experience_level string to enum
            experience_level = None
            if parsed_data.get("experience_level"):
                experience_level_str = parsed_data.get("experience_level").lower()
                # Map to enum values
                if experience_level_str == "младший":
                    experience_level = ExperienceLevel.JUNIOR
                elif experience_level_str == "средний":
                    experience_level = ExperienceLevel.MIDDLE
                elif experience_level_str == "старший":
                    experience_level = ExperienceLevel.SENIOR
                elif experience_level_str == "ведущий":
                    experience_level = ExperienceLevel.LEAD
                parsed_data["experience_level"] = experience_level

            # Validate with Pydantic schema
            try:
                validated_data = VacancyParsingSchema.model_validate(parsed_data)
                logger.info(f"Validated data: {validated_data}")
                # Use validated data for further processing
                parsed_data = validated_data.model_dump()
            except Exception as e:
                logger.warning(f"Schema validation failed, using raw data: {e}")

            vacancy = VacancyCreate(
                title=parsed_data.get("title") or "Не указано",
                description=parsed_data.get("description") or "Не указано",
                status="open",
                gigachat_file_id=file_id,
                company=parsed_data.get("company"),
                location=parsed_data.get("location"),
                salary_min=parsed_data.get("salary_min"),
                salary_max=parsed_data.get("salary_max"),
                employment_type=parsed_data.get("employment_type"),
                experience_level=parsed_data.get("experience_level"),
                requirements=parsed_data.get("requirements"),
                benefits=parsed_data.get("benefits"),
                skills=parsed_data.get("skills"),
                responsibilities=parsed_data.get("responsibilities"),
                domain=parsed_data.get("domain"),
                education=parsed_data.get("education"),
                minor_skills=parsed_data.get("minor_skills"),
                company_info=parsed_data.get("company_info"),
            )

            logger.info(f"Successfully created vacancy: {vacancy}")
            return vacancy, file_id

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(
                f"Response content: {response_content if 'response_content' in locals() else 'No response content'}"
            )
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
            result = self.gigachat_client.chat(
                {
                    "function_call": "auto",
                    "messages": [
                        {"role": "user", "content": question, "attachments": [file_id]}
                    ],
                    "temperature": 0.1,
                }
            )

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
            result = self.gigachat_client.chat(
                {
                    "function_call": "auto",
                    "messages": [
                        {"role": "user", "content": question, "attachments": [file_id]}
                    ],
                    "temperature": 0.1,
                }
            )

            return result.choices[0].message.content

        except Exception as e:
            raise PDFParsingError(f"Failed to analyze vacancy: {e}")


def get_pdf_parser_service() -> PDFParserService:
    """Dependency function to get PDF parser service instance"""
    return PDFParserService()
