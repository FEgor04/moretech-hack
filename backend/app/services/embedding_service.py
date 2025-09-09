"""
Embedding service for generating and managing text embeddings for candidates and vacancies.
Uses GigaChat API for Russian text embeddings.
"""

import json
import logging
from typing import List, Optional, Dict, Any

# Optional imports for similarity calculations
try:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity

    HAS_ML_LIBS = True
except ImportError:
    HAS_ML_LIBS = False
    np = None
    cosine_similarity = None

from app.models.candidate import Candidate
from app.models.vacancy import Vacancy
from app.models.embedding import CandidateEmbedding, VacancyEmbedding
from app.db.session import AsyncSession
from app.clients.gigachat import get_gigachat_client
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for managing text embeddings using GigaChat API"""

    def __init__(self):
        self.embedding_dimension = 1024  # GigaChat embeddings are 1024-dimensional
        self.model = "Embeddings"  # Use GigaChat's embedding model

    def _prepare_text_for_embedding(self, candidate: Candidate) -> str:
        """Подготовка текста кандидата для генерации эмбеддингов.
        Intentionally excludes explicit skills lists to avoid skills influencing embeddings.
        """
        text_parts = []

        # Основная информация
        if candidate.name:
            text_parts.append(f"Имя: {candidate.name}")
        if candidate.position:
            text_parts.append(f"Позиция: {candidate.position}")
        if candidate.geo:
            text_parts.append(f"Локация: {candidate.geo}")
        if candidate.employment_type:
            text_parts.append(f"Тип занятости: {candidate.employment_type}")

        # Навыки: исключаем из эмбеддингов по требованию, чтобы навыки оценивались отдельно LLM'ом

        # Experience
        if candidate.experience:
            try:
                experience = (
                    json.loads(candidate.experience)
                    if isinstance(candidate.experience, str)
                    else candidate.experience
                )
                if isinstance(experience, list):
                    exp_text = []
                    for exp in experience:
                        if isinstance(exp, dict):
                            company = exp.get("company", "")
                            position = exp.get("position", "")
                            years = exp.get("years", 0)
                            exp_text.append(f"{position} в {company} ({years} лет)")
                    if exp_text:
                        text_parts.append(f"Опыт работы: {'; '.join(exp_text)}")
            except (json.JSONDecodeError, TypeError):
                pass

        # Education
        if candidate.education:
            try:
                education = (
                    json.loads(candidate.education)
                    if isinstance(candidate.education, str)
                    else candidate.education
                )
                if isinstance(education, list):
                    edu_text = []
                    for edu in education:
                        if isinstance(edu, dict):
                            org = edu.get("organization", "")
                            spec = edu.get("speciality", "")
                            edu_type = edu.get("type", "")
                            edu_text.append(f"{spec} в {org} ({edu_type})")
                    if edu_text:
                        text_parts.append(f"Образование: {'; '.join(edu_text)}")
            except (json.JSONDecodeError, TypeError):
                pass

        return " ".join(text_parts)

    def _prepare_text_for_embedding_vacancy(self, vacancy: Vacancy) -> str:
        """Prepare vacancy text for embedding generation.
        Intentionally excludes explicit skills lists to avoid skills influencing embeddings.
        """
        text_parts = []

        # Basic info
        if vacancy.title:
            text_parts.append(f"Позиция: {vacancy.title}")
        if vacancy.description:
            text_parts.append(f"Описание: {vacancy.description}")
        if vacancy.company:
            text_parts.append(f"Компания: {vacancy.company}")
        if vacancy.location:
            text_parts.append(f"Локация: {vacancy.location}")
        if vacancy.domain:
            text_parts.append(f"Домен: {vacancy.domain}")
        if vacancy.employment_type:
            text_parts.append(f"Тип занятости: {vacancy.employment_type}")
        if vacancy.experience_level:
            text_parts.append(f"Уровень опыта: {vacancy.experience_level}")

        # Навыки: исключаем из эмбеддингов по требованию, чтобы навыки оценивались отдельно LLM'ом

        # Responsibilities
        if vacancy.responsibilities:
            try:
                responsibilities = (
                    json.loads(vacancy.responsibilities)
                    if isinstance(vacancy.responsibilities, str)
                    else vacancy.responsibilities
                )
                if isinstance(responsibilities, list):
                    text_parts.append(f"Обязанности: {'; '.join(responsibilities)}")
            except (json.JSONDecodeError, TypeError):
                text_parts.append(f"Обязанности: {vacancy.responsibilities}")

        # Requirements
        if vacancy.requirements:
            text_parts.append(f"Требования: {vacancy.requirements}")

        # Education
        if vacancy.education:
            text_parts.append(f"Образование: {vacancy.education}")

        # Company info
        if vacancy.company_info:
            text_parts.append(f"О компании: {vacancy.company_info}")

        return " ".join(text_parts)

    async def _get_embedding_from_gigachat(self, text: str) -> Optional[List[float]]:
        """Get embedding from GigaChat API"""
        if not text.strip():
            return None

        try:
            # Clean text - remove HTML tags and special characters
            clean_text = (
                text.replace("<br>", " ").replace("<p>", " ").replace("</p>", " ")
            )
            clean_text = " ".join(clean_text.split())  # Remove extra whitespace

            # Truncate text if too long (GigaChat has token limits)
            # Very conservative estimate: 1 token ≈ 2.5 characters for Russian text
            # GigaChat limit is 514 tokens, so we use ~1200 characters to be extremely safe
            if len(clean_text) > 1200:
                clean_text = clean_text[:1200]

            logger.info(f"Requesting embedding for text: {clean_text[:100]}...")

            # Get GigaChat client and generate embedding
            with get_gigachat_client() as giga:
                response = giga.embeddings([clean_text])

                if response and response.data and len(response.data) > 0:
                    embedding = response.data[0].embedding
                    if len(embedding) == self.embedding_dimension:
                        logger.info(
                            f"Successfully got embedding with dimension: {len(embedding)}"
                        )
                        return embedding
                    else:
                        logger.warning(
                            f"Wrong embedding dimension: {len(embedding)}, expected: {self.embedding_dimension}"
                        )
                else:
                    logger.warning("No embedding data in GigaChat response")
                    return None

        except Exception as e:
            logger.error(f"Error getting embedding from GigaChat: {e}")
            return None

    async def generate_candidate_embedding(
        self, session: AsyncSession, candidate: Candidate
    ) -> Optional[CandidateEmbedding]:
        """Generate and store embedding for a candidate"""
        try:
            # Prepare text for embedding
            text_content = self._prepare_text_for_embedding(candidate)

            # Get embedding from GigaChat API
            embedding_vector = await self._get_embedding_from_gigachat(text_content)

            if not embedding_vector:
                logger.warning(
                    f"Could not generate embedding for candidate {candidate.id}"
                )
                return None

            # Ensure vector has correct dimension
            if len(embedding_vector) != self.embedding_dimension:
                logger.warning(
                    f"Embedding dimension mismatch for candidate {candidate.id}: {len(embedding_vector)}"
                )
                return None

            # Remove existing embedding if any
            await session.execute(
                delete(CandidateEmbedding).where(
                    CandidateEmbedding.candidate_id == candidate.id
                )
            )

            # Create new embedding
            candidate_embedding = CandidateEmbedding(
                candidate_id=candidate.id,
                embedding=embedding_vector,
                text_content=text_content,
            )

            session.add(candidate_embedding)
            # Don't commit here - let the calling code handle the transaction
            await session.flush()  # Flush to get the ID without committing

            logger.info(f"Generated embedding for candidate {candidate.id}")
            return candidate_embedding

        except Exception as e:
            logger.error(f"Error generating candidate embedding: {e}")
            await session.rollback()
            return None

    async def generate_vacancy_embedding(
        self, session: AsyncSession, vacancy: Vacancy
    ) -> Optional[VacancyEmbedding]:
        """Generate and store embedding for a vacancy"""
        try:
            # Prepare text for embedding
            text_content = self._prepare_text_for_embedding_vacancy(vacancy)

            # Get embedding from GigaChat API
            embedding_vector = await self._get_embedding_from_gigachat(text_content)

            if not embedding_vector:
                logger.warning(f"Could not generate embedding for vacancy {vacancy.id}")
                return None

            # Ensure vector has correct dimension
            if len(embedding_vector) != self.embedding_dimension:
                logger.warning(
                    f"Embedding dimension mismatch for vacancy {vacancy.id}: {len(embedding_vector)}"
                )
                return None

            # Remove existing embedding if any
            await session.execute(
                delete(VacancyEmbedding).where(
                    VacancyEmbedding.vacancy_id == vacancy.id
                )
            )

            # Create new embedding
            vacancy_embedding = VacancyEmbedding(
                vacancy_id=vacancy.id,
                embedding=embedding_vector,
                text_content=text_content,
            )

            session.add(vacancy_embedding)
            # Don't commit here - let the calling code handle the transaction
            await session.flush()  # Flush to get the ID without committing

            logger.info(f"Generated embedding for vacancy {vacancy.id}")
            return vacancy_embedding

        except Exception as e:
            logger.error(f"Error generating vacancy embedding: {e}")
            await session.rollback()
            return None

    async def calculate_similarity(
        self, embedding1: List[float], embedding2: List[float]
    ) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            if not HAS_ML_LIBS:
                # Fallback to manual cosine similarity calculation
                raw_similarity = self._manual_cosine_similarity(embedding1, embedding2)
            else:
                # Convert to numpy arrays and reshape for sklearn
                vec1 = np.array(embedding1).reshape(1, -1)
                vec2 = np.array(embedding2).reshape(1, -1)

                # Calculate cosine similarity
                raw_similarity = cosine_similarity(vec1, vec2)[0][0]

            # Apply calibration to make scores more realistic
            calibrated_similarity = self._calibrate_similarity_score(raw_similarity)
            return float(calibrated_similarity)

        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0

    def _calibrate_similarity_score(self, raw_similarity: float) -> float:
        """
        Calibrate similarity score to make it more realistic.

        Raw cosine similarity scores tend to be high (0.7-0.95 for related content).
        This function applies a calibration curve to make scores more realistic
        and better distributed across the 0-1 range.
        """
        try:
            # Clamp input to valid range
            raw_similarity = max(0.0, min(1.0, raw_similarity))

            # Apply calibration curve: sigmoid-like transformation
            # This makes high scores (0.8+) more rare and distributes scores better

            # Parameters for calibration
            # These values were chosen to make scores more realistic:
            # - 0.95+ raw -> 0.85+ calibrated (excellent match)
            # - 0.85+ raw -> 0.70+ calibrated (good match)
            # - 0.75+ raw -> 0.55+ calibrated (fair match)
            # - 0.65+ raw -> 0.40+ calibrated (poor match)

            if raw_similarity >= 0.95:
                # Excellent matches: scale down slightly
                calibrated = (
                    0.85 + (raw_similarity - 0.95) * 3.0
                )  # 0.95->0.85, 1.0->1.0
            elif raw_similarity >= 0.85:
                # Good matches: moderate scaling
                calibrated = (
                    0.70 + (raw_similarity - 0.85) * 1.5
                )  # 0.85->0.70, 0.95->0.85
            elif raw_similarity >= 0.75:
                # Fair matches: more aggressive scaling
                calibrated = (
                    0.55 + (raw_similarity - 0.75) * 1.5
                )  # 0.75->0.55, 0.85->0.70
            elif raw_similarity >= 0.65:
                # Poor matches: very aggressive scaling
                calibrated = (
                    0.40 + (raw_similarity - 0.65) * 1.5
                )  # 0.65->0.40, 0.75->0.55
            else:
                # Very poor matches: keep low
                calibrated = raw_similarity * 0.6  # Scale down further

            # Ensure result is in valid range
            calibrated = max(0.0, min(1.0, calibrated))

            logger.debug(
                f"Calibrated similarity: {raw_similarity:.3f} -> {calibrated:.3f}"
            )
            return calibrated

        except Exception as e:
            logger.error(f"Error in similarity calibration: {e}")
            return raw_similarity  # Return original if calibration fails

    def _manual_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Manual cosine similarity calculation without numpy/sklearn"""
        try:
            if len(vec1) != len(vec2):
                return 0.0

            # Calculate dot product
            dot_product = sum(a * b for a, b in zip(vec1, vec2))

            # Calculate magnitudes
            magnitude1 = sum(a * a for a in vec1) ** 0.5
            magnitude2 = sum(b * b for b in vec2) ** 0.5

            if magnitude1 == 0 or magnitude2 == 0:
                return 0.0

            # Calculate cosine similarity
            similarity = dot_product / (magnitude1 * magnitude2)
            return float(similarity)

        except Exception as e:
            logger.error(f"Error in manual cosine similarity: {e}")
            return 0.0

    async def find_similar_candidates(
        self, session: AsyncSession, vacancy_id: int, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Find candidates most similar to a vacancy"""
        try:
            # Get vacancy embedding
            vacancy_embedding_query = select(VacancyEmbedding).where(
                VacancyEmbedding.vacancy_id == vacancy_id
            )
            result = await session.execute(vacancy_embedding_query)
            vacancy_embedding = result.scalar_one_or_none()

            if not vacancy_embedding:
                logger.warning(f"No embedding found for vacancy {vacancy_id}")
                return []

            # Get all candidate embeddings
            candidate_embeddings_query = select(CandidateEmbedding).options(
                selectinload(CandidateEmbedding.candidate)
            )
            result = await session.execute(candidate_embeddings_query)
            candidate_embeddings = result.scalars().all()

            # Calculate similarities
            similarities = []
            for candidate_embedding in candidate_embeddings:
                similarity = await self.calculate_similarity(
                    vacancy_embedding.embedding, candidate_embedding.embedding
                )
                similarities.append(
                    {
                        "candidate": candidate_embedding.candidate,
                        "similarity": similarity,
                        "embedding_id": candidate_embedding.id,
                    }
                )

            # Sort by similarity and return top results
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            return similarities[:limit]

        except Exception as e:
            logger.error(f"Error finding similar candidates: {e}")
            return []

    async def calculate_similarity_by_ids(
        self, session: AsyncSession, candidate_id: str, vacancy_id: int
    ) -> float:
        """Calculate similarity between candidate and vacancy by their IDs"""
        try:
            # Get candidate embedding
            candidate_embedding_query = select(CandidateEmbedding).where(
                CandidateEmbedding.candidate_id == candidate_id
            )
            result = await session.execute(candidate_embedding_query)
            candidate_embedding = result.scalar_one_or_none()

            if not candidate_embedding:
                logger.warning(f"No embedding found for candidate {candidate_id}")
                return 0.0

            # Get vacancy embedding
            vacancy_embedding_query = select(VacancyEmbedding).where(
                VacancyEmbedding.vacancy_id == vacancy_id
            )
            result = await session.execute(vacancy_embedding_query)
            vacancy_embedding = result.scalar_one_or_none()

            if not vacancy_embedding:
                logger.warning(f"No embedding found for vacancy {vacancy_id}")
                return 0.0

            # Calculate similarity
            similarity = await self.calculate_similarity(
                candidate_embedding.embedding, vacancy_embedding.embedding
            )

            return similarity

        except Exception as e:
            logger.error(f"Error calculating similarity by IDs: {e}")
            return 0.0

    async def find_similar_vacancies(
        self, session: AsyncSession, candidate_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Find vacancies most similar to a candidate"""
        try:
            # Get candidate embedding
            candidate_embedding_query = select(CandidateEmbedding).where(
                CandidateEmbedding.candidate_id == candidate_id
            )
            result = await session.execute(candidate_embedding_query)
            candidate_embedding = result.scalar_one_or_none()

            if not candidate_embedding:
                logger.warning(f"No embedding found for candidate {candidate_id}")
                return []

            # Get all vacancy embeddings
            vacancy_embeddings_query = select(VacancyEmbedding).options(
                selectinload(VacancyEmbedding.vacancy)
            )
            result = await session.execute(vacancy_embeddings_query)
            vacancy_embeddings = result.scalars().all()

            # Calculate similarities
            similarities = []
            for vacancy_embedding in vacancy_embeddings:
                similarity = await self.calculate_similarity(
                    candidate_embedding.embedding, vacancy_embedding.embedding
                )
                similarities.append(
                    {
                        "vacancy": vacancy_embedding.vacancy,
                        "similarity": similarity,
                        "embedding_id": vacancy_embedding.id,
                    }
                )

            # Sort by similarity and return top results
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            return similarities[:limit]

        except Exception as e:
            logger.error(f"Error finding similar vacancies: {e}")
            return []


# Global instance
embedding_service = EmbeddingService()
