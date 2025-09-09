"""
Compatibility analysis service for matching candidates with vacancies.
Provides detailed compatibility reports and recommendations.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

from app.models.candidate import Candidate
from app.models.vacancy import Vacancy
from app.services.embedding_service import embedding_service
from app.services.skills_llm_service import skills_llm_service
from app.db.session import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)


class MatchLevel(Enum):
    EXCELLENT = "Отличное совпадение"
    GOOD = "Хорошее совпадение"
    FAIR = "Удовлетворительное совпадение"
    POOR = "Плохое совпадение"


@dataclass
class SkillsAnalysis:
    matched_core_skills: List[str]
    matched_percentage: int
    missing_critical_skills: List[str]
    bonus_skills_candidate_has: List[str]
    skills_gap_assessment: str


@dataclass
class ExperienceAnalysis:
    relevant_experience_years: int
    domain_match: str
    role_progression: str
    relevant_projects: List[str]
    experience_level_fit: str


@dataclass
class CompatibilityReport:
    executive_summary: Dict[str, Any]
    candidate_profile: Dict[str, Any]
    detailed_analysis: Dict[str, Any]
    potential_concerns: List[str]
    hiring_recommendation: str
    next_steps: List[str]


class CompatibilityService:
    """Service for analyzing candidate-vacancy compatibility"""

    def __init__(self):
        self.embedding_service = embedding_service

    def _parse_skills(self, skills_data: Any) -> List[str]:
        """Parse skills from various formats"""
        if not skills_data:
            return []

        if isinstance(skills_data, str):
            try:
                return json.loads(skills_data)
            except json.JSONDecodeError:
                return [skills_data]
        elif isinstance(skills_data, list):
            return skills_data
        else:
            return []

    def _parse_experience(self, experience_data: Any) -> List[Dict[str, Any]]:
        """Parse experience from various formats"""
        if not experience_data:
            return []

        if isinstance(experience_data, str):
            try:
                return json.loads(experience_data)
            except json.JSONDecodeError:
                return []
        elif isinstance(experience_data, list):
            return experience_data
        else:
            return []

    def _calculate_experience_years(self, experience: List[Dict[str, Any]]) -> int:
        """Calculate total years of experience"""
        total_years = 0
        for exp in experience:
            if isinstance(exp, dict) and "years" in exp:
                try:
                    total_years += int(exp["years"])
                except (ValueError, TypeError):
                    pass
        return total_years

    def _analyze_skills_match(
        self, candidate: Candidate, vacancy: Vacancy
    ) -> SkillsAnalysis:
        """Analyze skills compatibility using LLM-based matching (GigaChat)."""
        # Parse raw lists (no normalization; let LLM reason with original labels)
        candidate_skills_list: List[str] = []
        if candidate.skills:
            candidate_skills_list.extend(self._parse_skills(candidate.skills))
        if candidate.tech:
            candidate_skills_list.extend(self._parse_skills(candidate.tech))

        vacancy_skills_list: List[str] = []
        if vacancy.skills:
            vacancy_skills_list.extend(self._parse_skills(vacancy.skills))
        if vacancy.minor_skills:
            vacancy_skills_list.extend(self._parse_skills(vacancy.minor_skills))

        # Call LLM to classify vacancy skills into matching/unmatching
        llm_result = skills_llm_service.analyze_candidate_vacancy_skills(
            candidate_skills_list, vacancy_skills_list
        )

        matching = llm_result.get("matching", [])
        unmatching = llm_result.get("unmatching", [])

        # Compute percentage against vacancy skills
        total_required = len(vacancy_skills_list)
        match_percentage = (
            int((len(matching) / total_required) * 100) if total_required else 0
        )

        # Build outputs
        matched_core_skills = matching
        missing_critical_skills = unmatching

        # Bonus skills = candidate skills not required by vacancy (simple diff)
        candidate_set = {str(s).strip() for s in candidate_skills_list}
        vacancy_set = {str(s).strip() for s in vacancy_skills_list}
        bonus_skills = [
            s
            for s in candidate_set
            if s not in {str(m).strip() for m in matching} and s not in vacancy_set
        ]

        # Gap assessment
        if match_percentage >= 80:
            gap_assessment = "Отличное совпадение навыков"
        elif match_percentage >= 60:
            gap_assessment = "Хорошее совпадение навыков с небольшими пробелами"
        elif match_percentage >= 40:
            gap_assessment = "Умеренный пробел в навыках, требуется обучение"
        else:
            gap_assessment = (
                "Значительный пробел в навыках, требуется обширное обучение"
            )

        return SkillsAnalysis(
            matched_core_skills=list(matched_core_skills),
            matched_percentage=match_percentage,
            missing_critical_skills=list(missing_critical_skills),
            bonus_skills_candidate_has=list(bonus_skills),
            skills_gap_assessment=gap_assessment,
        )

    def _analyze_experience(
        self, candidate: Candidate, vacancy: Vacancy
    ) -> ExperienceAnalysis:
        """Analyze experience compatibility"""
        experience = self._parse_experience(candidate.experience)
        total_years = self._calculate_experience_years(experience)

        # Determine domain match
        candidate_domain = "General"  # Default
        vacancy_domain = vacancy.domain or "General"

        # Simple domain matching logic
        if vacancy_domain.lower() in ["it", "технологии", "разработка"]:
            candidate_domain = (
                "IT"
                if any(
                    "разработ" in str(exp).lower() or "программ" in str(exp).lower()
                    for exp in experience
                )
                else "General"
            )

        domain_match = f"{candidate_domain} -> {vacancy_domain}"

        # Analyze role progression
        if total_years >= 5:
            progression = "Старший уровень с потенциалом лидерства"
        elif total_years >= 3:
            progression = "Средний уровень с потенциалом роста"
        elif total_years >= 1:
            progression = "Переход от младшего к среднему уровню"
        else:
            progression = "Начальный уровень"

        # Extract relevant projects
        relevant_projects = []
        for exp in experience:
            if isinstance(exp, dict):
                position = exp.get("position", "").lower()
                if any(
                    keyword in position
                    for keyword in ["разработ", "программ", "анализ", "управлен"]
                ):
                    relevant_projects.append(
                        f"{exp.get('position', '')} at {exp.get('company', '')}"
                    )

        # Determine experience level fit
        vacancy_level = vacancy.experience_level or "средний"
        if vacancy_level.lower() in ["младший", "junior"]:
            level_fit = (
                "Идеальное совпадение" if total_years <= 2 else "Переквалификация"
            )
        elif vacancy_level.lower() in ["средний", "middle"]:
            level_fit = (
                "Идеальное совпадение"
                if 2 <= total_years <= 5
                else "Может потребоваться корректировка"
            )
        elif vacancy_level.lower() in ["старший", "senior"]:
            level_fit = (
                "Идеальное совпадение"
                if total_years >= 3
                else "Недостаточная квалификация"
            )
        else:
            level_fit = "Хорошее совпадение"

        return ExperienceAnalysis(
            relevant_experience_years=total_years,
            domain_match=domain_match,
            role_progression=progression,
            relevant_projects=relevant_projects[:3],  # Top 3 most relevant
            experience_level_fit=level_fit,
        )

    def _calculate_overall_score(
        self, embedding_similarity: float, skills_match_percentage: int
    ) -> float:
        """Weighted overall score using embeddings for non-skill match and LLM skills percent.
        Embedding similarity is in [0,1]; skills percent is [0,100].
        Weights: 40% embeddings, 60% skills.
        """
        try:
            embedding_score = max(0.0, min(100.0, embedding_similarity * 100.0))
            skills_score = max(0.0, min(100.0, float(skills_match_percentage)))
            overall = embedding_score * 0.40 + skills_score * 0.60
            return max(0.0, min(100.0, overall))
        except Exception:
            return embedding_similarity * 100.0

    def _determine_match_level(self, overall_score: float) -> MatchLevel:
        """Determine overall match level based on score"""
        if overall_score >= 80:
            return MatchLevel.EXCELLENT
        elif overall_score >= 65:
            return MatchLevel.GOOD
        elif overall_score >= 45:
            return MatchLevel.FAIR
        else:
            return MatchLevel.POOR

    def _generate_concerns(
        self,
        skills_analysis: SkillsAnalysis,
        experience_analysis: ExperienceAnalysis,
        overall_score: float,
    ) -> List[str]:
        """Generate potential concerns based on analysis"""
        concerns = []

        # Skills concerns
        if skills_analysis.matched_percentage < 40:
            concerns.append(
                f"Недостаточное совпадение по навыкам ({skills_analysis.matched_percentage}% совпадения)"
            )
        elif skills_analysis.matched_percentage < 60:
            concerns.append(
                f"Существенный разрыв в навыках: {skills_analysis.skills_gap_assessment}"
            )
        elif skills_analysis.missing_critical_skills:
            concerns.append(
                f"Отсутствуют критически важные навыки: {', '.join(skills_analysis.missing_critical_skills[:3])}"
            )

        # Experience concerns (checks updated to Russian labels)
        if experience_analysis.experience_level_fit == "Переквалификация":
            concerns.append(
                "Риск переквалификации — кандидат может ожидать более высокую компенсацию"
            )
        elif experience_analysis.experience_level_fit == "Недостаточная квалификация":
            concerns.append("Может потребоваться дополнительное обучение и менторство")

        # General concerns
        if overall_score < 70:
            concerns.append("Общая совместимость ниже рекомендуемого порога")

        # Add standard concerns (translated)
        concerns.extend(
            [
                "Необходимо обсудить ожидания по зарплате",
                "Требуется уточнить предпочтения по локации и удаленной работе",
                "Нужно уточнить срок уведомления об увольнении и доступность",
            ]
        )

        return concerns

    def _generate_recommendation(
        self, match_level: MatchLevel, overall_score: float
    ) -> str:
        """Generate hiring recommendation"""
        if match_level == MatchLevel.EXCELLENT:
            return (
                "Сильная рекомендация для немедленного собеседования и возможного найма"
            )
        elif match_level == MatchLevel.GOOD:
            return "Хороший кандидат, рекомендуется собеседование с фокусом на конкретные пробелы в навыках"
        elif match_level == MatchLevel.FAIR:
            return "Рассмотреть для собеседования, если нет лучших кандидатов, обсудить потребности в обучении"
        else:
            return "Не рекомендуется для данной позиции, рассмотреть для других ролей"

    def _generate_next_steps(self, match_level: MatchLevel) -> List[str]:
        """Generate recommended next steps"""
        if match_level in [MatchLevel.EXCELLENT, MatchLevel.GOOD]:
            return [
                "Запланировать техническое собеседование в течение 1 недели",
                "Подготовить оценку навыков для недостающих компетенций",
                "Обсудить ожидания по зарплате и льготам",
                "Организовать встречу с тимлидом для оценки культурного соответствия",
            ]
        elif match_level == MatchLevel.FAIR:
            return [
                "Запланировать предварительное собеседование для оценки потенциала",
                "Подготовить детальный план обучения для пробелов в навыках",
                "Рассмотреть испытательный период с наставничеством",
                "Оценить по сравнению с другими кандидатами перед окончательным решением",
            ]
        else:
            return [
                "Рассмотреть для других открытых позиций, если доступны",
                "Сохранить в пуле талантов для будущих возможностей",
                "Предоставить обратную связь по областям для улучшения",
            ]

    async def analyze_compatibility(
        self, session: AsyncSession, candidate_id: str, vacancy_id: int
    ) -> Optional[CompatibilityReport]:
        """Generate comprehensive compatibility report"""
        try:
            # Get candidate and vacancy
            candidate_query = select(Candidate).where(Candidate.id == candidate_id)
            vacancy_query = select(Vacancy).where(Vacancy.id == vacancy_id)

            candidate_result = await session.execute(candidate_query)
            vacancy_result = await session.execute(vacancy_query)

            candidate = candidate_result.scalar_one_or_none()
            vacancy = vacancy_result.scalar_one_or_none()

            if not candidate or not vacancy:
                logger.error(
                    f"Candidate {candidate_id} or vacancy {vacancy_id} not found"
                )
                return None

            # Get embedding similarity score for consistency with top candidates
            embedding_similarity = (
                await self.embedding_service.calculate_similarity_by_ids(
                    session, candidate_id, vacancy_id
                )
            )

            # Analyze skills and experience
            skills_analysis = self._analyze_skills_match(candidate, vacancy)
            experience_analysis = self._analyze_experience(candidate, vacancy)

            # Combine calibrated embedding similarity with LLM skills percent
            overall_score = self._calculate_overall_score(
                embedding_similarity, skills_analysis.matched_percentage
            )

            # Determine match level
            match_level = self._determine_match_level(overall_score)

            # Generate concerns and recommendations
            concerns = self._generate_concerns(
                skills_analysis, experience_analysis, overall_score
            )
            recommendation = self._generate_recommendation(match_level, overall_score)
            next_steps = self._generate_next_steps(match_level)

            # Build executive summary
            # Generate key strengths based on actual performance
            key_strengths = []

            # Add skills assessment based on actual percentage - only positive matches go to strengths
            if skills_analysis.matched_percentage >= 60:
                key_strengths.append(
                    f"Сильное совпадение по навыкам ({skills_analysis.matched_percentage}% совпадения)"
                )
            elif skills_analysis.matched_percentage >= 40:
                key_strengths.append(
                    f"Умеренное совпадение по навыкам ({skills_analysis.matched_percentage}% совпадения)"
                )
            # Poor skill matches (<40%) are handled in concerns, not strengths

            # Add experience if relevant
            if experience_analysis.relevant_experience_years > 0:
                key_strengths.append(
                    f"Релевантный опыт ({experience_analysis.relevant_experience_years} лет)"
                )

            # Add domain match if positive
            if (
                experience_analysis.domain_match
                and "совпадение" in experience_analysis.domain_match.lower()
            ):
                key_strengths.append(
                    f"Совпадение по домену: {experience_analysis.domain_match}"
                )

            executive_summary = {
                "overall_match_score": f"{overall_score:.0f}%",
                "match_level": match_level.value,
                "recommendation": recommendation,
                "key_strengths": key_strengths,
                "main_concerns": concerns[:2],  # Топ-2 проблемы
            }

            # Build candidate profile
            candidate_profile = {
                "name": candidate.name,
                "current_position": candidate.position,
                "experience_level": f"{experience_analysis.relevant_experience_years} years",
                "location": candidate.geo or "Not specified",
                "preferred_employment": candidate.employment_type or "Not specified",
                "contact": candidate.email or "Not provided",
            }

            # Build detailed analysis
            detailed_analysis = {
                "candidate_analysis": {
                    "skills_match": {
                        "matched_core_skills": skills_analysis.matched_core_skills,
                        "matched_percentage": skills_analysis.matched_percentage,
                        "missing_critical_skills": skills_analysis.missing_critical_skills,
                        "bonus_skills_candidate_has": skills_analysis.bonus_skills_candidate_has,
                        "skills_gap_assessment": skills_analysis.skills_gap_assessment,
                    },
                    "experience_analysis": {
                        "relevant_experience_years": experience_analysis.relevant_experience_years,
                        "domain_match": experience_analysis.domain_match,
                        "role_progression": experience_analysis.role_progression,
                        "relevant_projects": experience_analysis.relevant_projects,
                        "experience_level_fit": experience_analysis.experience_level_fit,
                    },
                }
            }

            return CompatibilityReport(
                executive_summary=executive_summary,
                candidate_profile=candidate_profile,
                detailed_analysis=detailed_analysis,
                potential_concerns=concerns,
                hiring_recommendation=recommendation,
                next_steps=next_steps,
            )

        except Exception as e:
            logger.error(f"Error analyzing compatibility: {e}")
            return None


# Global instance
compatibility_service = CompatibilityService()
