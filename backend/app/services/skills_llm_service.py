"""
LLM-based skills matching service using GigaChat chat completions.

The service compares candidate skills with vacancy skills and returns
JSON with two lists:
- matching: vacancy skills that are satisfied by candidate skills
- unmatching: vacancy skills that are NOT satisfied by candidate skills
"""

import json
import logging
from typing import List, Dict, Any

from app.clients.gigachat import get_gigachat_client

logger = logging.getLogger(__name__)


class SkillsLLMService:
    """Service to evaluate skill matches using GigaChat."""

    def __init__(self) -> None:
        pass

    def _build_prompt(
        self, candidate_skills: List[str], vacancy_skills: List[str]
    ) -> List[Dict[str, Any]]:
        system = (
            "Ты — строгий генератор JSON. Сопоставляй требования из vacancy_skills с навыками из candidate_skills. "
            "Понимай синонимы, аббревиатуры и типичные эквиваленты (например: PostgreSQL ~ SQL/БД; JS ~ JavaScript). "
            "ОЧЕНЬ ВАЖНО: массивы 'matching' и 'unmatching' ДОЛЖНЫ содержать ИСКЛЮЧИТЕЛЬНО исходные строки из vacancy_skills, без изменений. "
            "Если строка навыка в вакансии содержит логические альтернативы (например: 'Go или Python', 'Go/Python', 'Go or Python', 'Go | Python'), "
            "то считай этот пункт удовлетворённым, если у кандидата есть ЛЮБОЙ из перечисленных вариантов. "
            "Запятые или перечисления в отдельных пунктах vacancy_skills — это отдельные требования (каждый отдельно). "
            "Выводи ТОЛЬКО JSON с ключами 'matching' и 'unmatching' (оба — массивы строк). Никаких пояснений."
        )

        # Примеры для повышения точности интерпретации "или":
        examples = (
            "Пример 1:\n"
            'candidate_skills: ["Go"]\n'
            'vacancy_skills: ["Go или Python"]\n'
            'Ответ: {"matching":["Go или Python"],"unmatching":[]}\n\n'
            "Пример 2:\n"
            'candidate_skills: ["PostgreSQL", "Docker"]\n'
            'vacancy_skills: ["SQL", "Docker", "Kubernetes"]\n'
            'Ответ: {"matching":["Docker"],"unmatching":["SQL","Kubernetes"]} (SQL не засчитывай, если это отдельный пункт без явного соответствия)\n\n'
        )

        user = (
            examples
            + "Сопоставь навыки и верни JSON.\n\n"
            + f"candidate_skills: {json.dumps(candidate_skills, ensure_ascii=False)}\n"
            + f"vacancy_skills: {json.dumps(vacancy_skills, ensure_ascii=False)}\n\n"
            + "Строгий формат ответа (без текста и markdown):\n"
            + '{\n  "matching": [.. ИСКЛЮЧИТЕЛЬНО элементы из vacancy_skills ..],\n  "unmatching": [.. ИСКЛЮЧИТЕЛЬНО элементы из vacancy_skills ..]\n}'
        )

        return [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]

    def analyze_candidate_vacancy_skills(
        self, candidate_skills: List[str], vacancy_skills: List[str]
    ) -> Dict[str, List[str]]:
        """
        Ask GigaChat to compute which vacancy skills are satisfied by the candidate.

        Returns a dict with keys:
        - matching: list[str]
        - unmatching: list[str]
        """
        try:
            if not vacancy_skills:
                return {"matching": [], "unmatching": []}

            messages = self._build_prompt(candidate_skills or [], vacancy_skills or [])

            with get_gigachat_client() as client:
                result = client.chat(
                    {
                        "function_call": "none",
                        "messages": messages,
                        "temperature": 0.0,
                        "max_tokens": 300,
                        "stream": False,
                    }
                )

            content = (
                result.choices[0].message.content if result and result.choices else ""
            )
            if not content:
                logger.warning("Empty response from GigaChat for skills analysis")
                return {"matching": [], "unmatching": vacancy_skills}

            # Try to parse JSON directly
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                # Fallback: extract JSON substring heuristically
                start = content.find("{")
                end = content.rfind("}")
                if start != -1 and end != -1 and end > start:
                    data = json.loads(content[start : end + 1])
                else:
                    logger.warning(
                        "Failed to parse JSON from GigaChat skills analysis response"
                    )
                    return {"matching": [], "unmatching": vacancy_skills}

            matching = data.get("matching") or []
            unmatching = data.get("unmatching") or []

            # Ensure they are lists of strings and only include vacancy skills
            def sanitize(items: Any) -> List[str]:
                if not isinstance(items, list):
                    return []
                cleaned = []
                vacancy_set = {str(s).strip().lower() for s in (vacancy_skills or [])}
                for it in items:
                    if isinstance(it, str) and it.strip():
                        # normalize for membership check, but keep original casing from vacancy list if possible
                        it_norm = it.strip().lower()
                        # Map back to original vacancy skill casing if present
                        original = next(
                            (
                                v
                                for v in vacancy_skills
                                if str(v).strip().lower() == it_norm
                            ),
                            it.strip(),
                        )
                        if it_norm in vacancy_set:
                            cleaned.append(original)
                return cleaned

            matching_clean = sanitize(matching)
            unmatching_clean = sanitize(unmatching)

            # Fallback: если LLM не учёл "или"/alternatives внутри одного пункта вакансии
            # Добавим соответствия для пунктов вида "Go или Python" если у кандидата есть хотя бы один вариант
            if vacancy_skills:
                additional_matches = self._fallback_match_alternatives(
                    vacancy_skills, candidate_skills
                )
                # Добавляем только те, которых ещё нет
                for v in additional_matches:
                    if v not in matching_clean:
                        matching_clean.append(v)
                        # и убрать из unmatching если присутствует
                        if v in unmatching_clean:
                            unmatching_clean = [x for x in unmatching_clean if x != v]

            # If the model didn't partition correctly, derive unmatching from vacancy - matching
            if not unmatching_clean:
                vac_set = {str(s).strip().lower() for s in vacancy_skills}
                match_set = {str(s).strip().lower() for s in matching_clean}
                derived_unmatching = [
                    v
                    for v in vacancy_skills
                    if str(v).strip().lower() not in match_set
                    and str(v).strip().lower() in vac_set
                ]
                unmatching_clean = derived_unmatching

            return {"matching": matching_clean, "unmatching": unmatching_clean}

        except Exception as e:
            logger.error(f"Error analyzing skills via GigaChat: {e}")
            return {"matching": [], "unmatching": vacancy_skills or []}

    def _fallback_match_alternatives(
        self, vacancy_skills: List[str], candidate_skills: List[str]
    ) -> List[str]:
        """
        Простая эвристика: если пункт вакансии содержит альтернативы (или/or/|/слэш),
        считаем его удовлетворённым, если кандидат имеет хотя бы один из вариантов.
        Возвращаем список исходных пунктов вакансии, которые должны считаться matching.
        """
        try:
            cand_set = {str(s).strip().lower() for s in (candidate_skills or [])}
            result: List[str] = []
            for v in vacancy_skills or []:
                v_str = str(v)
                v_lower = v_str.lower()
                # Маркеры альтернатив в одном пункте
                if any(tok in v_lower for tok in [" или ", " or ", "|", "/"]):
                    # Нормализуем разделители к пробелам, далее сплитим по не-буквенным границам
                    # Сначала грубое разбиение по типичным разделителям альтернатив
                    parts_raw = (
                        v_lower.replace(" или ", "|")
                        .replace(" or ", "|")
                        .replace("/", "|")
                    ).split("|")
                    # Очистка токенов
                    parts = [p.strip() for p in parts_raw if p and p.strip()]
                    # Если кандидат имеет хоть один вариант — засчитываем весь пункт
                    if any(p in cand_set for p in parts):
                        result.append(v_str)
            return result
        except Exception:
            return []


# Global instance
skills_llm_service = SkillsLLMService()
