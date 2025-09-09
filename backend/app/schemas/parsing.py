"""
Pydantic schemas for PDF parsing with GigaChat.
These schemas are used to generate JSON schemas for more precise AI parsing.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class CVExperienceItem(BaseModel):
    """Experience item for CV parsing"""

    company: str = Field(description="Company name where the candidate worked")
    position: str = Field(description="Job title/position held at the company")
    years: int = Field(
        description="Number of years worked at this position", ge=0, le=50
    )


class CVEducationItem(BaseModel):
    """Education item for CV parsing"""

    organization: str = Field(description="Educational institution name")
    speciality: str = Field(description="Field of study or specialization")
    type: str = Field(
        description="Type of education: 'высшее', 'среднее', 'курсы', 'сертификат'"
    )


class CVParsingSchema(BaseModel):
    """Schema for CV parsing with GigaChat"""

    name: str = Field(
        description="Full name of the candidate. Extract the complete name as written in the CV."
    )
    email: Optional[str] = Field(
        description="Email address of the candidate. Extract if available, otherwise use null.",
        default=None,
    )
    position: str = Field(
        description="Desired position or current position. Extract the job title the candidate is seeking or currently holds."
    )
    experience: List[CVExperienceItem] = Field(
        description="List of work experience entries. Extract ALL work experience entries with company name, position, and years worked.",
        default_factory=list,
    )
    skills: List[str] = Field(
        description="Key skills and competencies. Extract ALL main skills, competencies, and abilities mentioned in the CV.",
        default_factory=list,
    )
    tech: List[str] = Field(
        description="Technical skills, programming languages, tools, frameworks. Extract ALL technologies, programming languages, frameworks, tools, and technical skills mentioned in the CV.",
        default_factory=list,
    )
    education: List[CVEducationItem] = Field(
        description="Educational background. Extract ALL educational institutions, courses, and certificates mentioned.",
        default_factory=list,
    )
    geo: Optional[str] = Field(
        description="Geographic preferences or location. Extract location preferences or current location if mentioned.",
        default=None,
    )
    employment_type: Optional[str] = Field(
        description="Preferred employment type. Use: 'полная занятость', 'частичная занятость', 'контракт', 'стажировка'.",
        default=None,
    )


class VacancyParsingSchema(BaseModel):
    """Schema for vacancy parsing with GigaChat"""

    title: str = Field(
        description="Job title or position name. Extract the exact job title from the vacancy."
    )
    description: str = Field(
        description="Detailed job description. Extract the complete job description and summary."
    )
    company: Optional[str] = Field(
        description="Company name. Extract the name of the hiring company.",
        default=None,
    )
    location: Optional[str] = Field(
        description="Job location. Extract the city, country, or work location (e.g., 'Moscow, Russia').",
        default=None,
    )
    salary_min: Optional[int] = Field(
        description="Minimum salary. Extract the minimum salary as a number only (no currency symbols or text).",
        default=None,
        ge=0,
    )
    salary_max: Optional[int] = Field(
        description="Maximum salary. Extract the maximum salary as a number only (no currency symbols or text).",
        default=None,
        ge=0,
    )
    employment_type: Optional[str] = Field(
        description="Employment type. Use: 'полная занятость', 'частичная занятость', 'контракт', 'стажировка'.",
        default=None,
    )
    experience_level: Optional[str] = Field(
        description="Required experience level. Use: 'младший', 'средний', 'старший', 'ведущий'.",
        default=None,
    )
    requirements: Optional[str] = Field(
        description="Job requirements. Extract general requirements and qualifications for the candidate.",
        default=None,
    )
    benefits: Optional[str] = Field(
        description="Job benefits. Extract all benefits, perks, and advantages mentioned.",
        default=None,
    )
    skills: List[str] = Field(
        description="Required technical and soft skills. Extract ALL mandatory technical and soft skills mentioned in the vacancy.",
        default_factory=list,
    )
    responsibilities: List[str] = Field(
        description="Main job responsibilities and duties. Extract ALL main responsibilities and tasks mentioned.",
        default_factory=list,
    )
    domain: Optional[str] = Field(
        description="Business domain or industry. Extract the business sector or industry (e.g., 'IT', 'Finance', 'Healthcare').",
        default=None,
    )
    education: Optional[str] = Field(
        description="Required education and certifications. Extract ALL education requirements and certifications mentioned.",
        default=None,
    )
    minor_skills: List[str] = Field(
        description="Optional or nice-to-have skills. Extract skills mentioned as 'desirable', 'plus', 'advantage', or 'nice-to-have'.",
        default_factory=list,
    )
    company_info: Optional[str] = Field(
        description="Company type, size, and additional information. Extract information about company type, size, and special characteristics.",
        default=None,
    )
