"""
API endpoints for candidate-vacancy compatibility analysis.
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.candidate import Candidate
from app.models.vacancy import Vacancy
from app.services.compatibility_service import compatibility_service
from app.services.embedding_service import embedding_service
from sqlalchemy import select

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compatibility", tags=["compatibility"])


@router.get("/candidate/{candidate_id}/vacancy/{vacancy_id}/report")
async def get_compatibility_report(
    candidate_id: str, vacancy_id: int, session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Generate detailed compatibility report between a candidate and vacancy.
    """
    try:
        report = await compatibility_service.analyze_compatibility(
            session, candidate_id, vacancy_id
        )

        if not report:
            raise HTTPException(
                status_code=404,
                detail="Candidate or vacancy not found, or unable to generate report",
            )

        return {
            "executive_summary": report.executive_summary,
            "candidate_profile": report.candidate_profile,
            "detailed_analysis": report.detailed_analysis,
            "potential_concerns": report.potential_concerns,
            "hiring_recommendation": report.hiring_recommendation,
            "next_steps": report.next_steps,
        }

    except Exception as e:
        logger.error(f"Error generating compatibility report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/candidate/{candidate_id}/top-vacancies")
async def get_top_vacancies_for_candidate(
    candidate_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    """
    Find top matching vacancies for a candidate based on embedding similarity.
    """
    try:
        # Check if candidate exists
        candidate_query = select(Candidate).where(Candidate.id == candidate_id)
        result = await session.execute(candidate_query)
        candidate = result.scalar_one_or_none()

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Find similar vacancies
        similar_vacancies = await embedding_service.find_similar_vacancies(
            session, candidate_id, limit
        )

        # Format response
        response = []
        for item in similar_vacancies:
            vacancy = item["vacancy"]
            similarity = item["similarity"]
            # Compute overall score to align with report (may be slower)
            try:
                report = await compatibility_service.analyze_compatibility(
                    session, candidate_id, vacancy.id
                )
                overall_score = None
                if (
                    report
                    and report.executive_summary
                    and "overall_match_score" in report.executive_summary
                ):
                    # overall_match_score like "72%" -> float 72.0
                    score_str = report.executive_summary["overall_match_score"]
                    overall_score = float(str(score_str).replace("%", "").strip())
            except Exception:
                overall_score = None

            response.append(
                {
                    "vacancy_id": vacancy.id,
                    "title": vacancy.title,
                    "company": vacancy.company,
                    "location": vacancy.location,
                    "domain": vacancy.domain,
                    "employment_type": vacancy.employment_type,
                    "experience_level": vacancy.experience_level,
                    "similarity_score": round(
                        similarity * 100, 2
                    ),  # Calibrated similarity percentage
                    "overall_score": round(
                        (
                            overall_score
                            if overall_score is not None
                            else similarity * 100
                        ),
                        2,
                    ),
                    "match_level": _get_match_level_from_score(similarity),
                }
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding top vacancies for candidate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/vacancy/{vacancy_id}/top-candidates")
async def get_top_candidates_for_vacancy(
    vacancy_id: int,
    limit: int = Query(default=10, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    """
    Find top matching candidates for a vacancy based on embedding similarity.
    """
    try:
        # Check if vacancy exists
        vacancy_query = select(Vacancy).where(Vacancy.id == vacancy_id)
        result = await session.execute(vacancy_query)
        vacancy = result.scalar_one_or_none()

        if not vacancy:
            raise HTTPException(status_code=404, detail="Vacancy not found")

        # Find similar candidates
        similar_candidates = await embedding_service.find_similar_candidates(
            session, vacancy_id, limit
        )

        # Format response
        response = []
        for item in similar_candidates:
            candidate = item["candidate"]
            similarity = item["similarity"]
            # Compute overall score to align with report (may be slower)
            try:
                report = await compatibility_service.analyze_compatibility(
                    session, candidate.id, vacancy_id
                )
                overall_score = None
                if (
                    report
                    and report.executive_summary
                    and "overall_match_score" in report.executive_summary
                ):
                    score_str = report.executive_summary["overall_match_score"]
                    overall_score = float(str(score_str).replace("%", "").strip())
            except Exception:
                overall_score = None

            response.append(
                {
                    "candidate_id": candidate.id,
                    "name": candidate.name,
                    "position": candidate.position,
                    "email": candidate.email,
                    "geo": candidate.geo,
                    "employment_type": candidate.employment_type,
                    "similarity_score": round(
                        similarity * 100, 2
                    ),  # Calibrated similarity percentage
                    "overall_score": round(
                        (
                            overall_score
                            if overall_score is not None
                            else similarity * 100
                        ),
                        2,
                    ),
                    "match_level": _get_match_level_from_score(similarity),
                }
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding top candidates for vacancy: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def _get_match_level_from_score(similarity_score: float) -> str:
    """Convert similarity score to match level"""
    if similarity_score >= 0.8:
        return "Отличное совпадение"
    elif similarity_score >= 0.65:
        return "Хорошее совпадение"
    elif similarity_score >= 0.45:
        return "Удовлетворительное совпадение"
    else:
        return "Плохое совпадение"
