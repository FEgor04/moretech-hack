import logging
from typing import List
from gigachat import GigaChat
from gigachat.models import Function, FunctionParameters, MessagesRole
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import Interview
from app.models.candidate import Candidate
from app.models.vacancy import Vacancy
from app.models.interview_message import InterviewMessage, InterviewMessageType
from app.schemas.common import InterviewMessageCreateRequest
from app.services.exceptions import NotFoundError, ConflictError
from app.clients.gigachat import get_gigachat_client

logger = logging.getLogger(__name__)

# Global configuration for GigaChat
GIGACHAT_TEMPERATURE = 0.3
GIGACHAT_MAX_TOKENS = 1000
INITIAL_GREETING_TEMPERATURE = 0.3
INITIAL_GREETING_MAX_TOKENS = 200

# Business rules
MIN_MESSAGES_FOR_FINISH_FUNCTION = 8


class InterviewMessagesService:
    """Service for managing interview messages with GigaChat integration."""

    def __init__(self):
        self.gigachat_client = None

    async def _get_gigachat_client(self):
        """Get GigaChat client instance."""
        if self.gigachat_client is None:
            self.gigachat_client = get_gigachat_client()
        return self.gigachat_client

    async def _call_gigachat_async(self, client: GigaChat, chat_params):
        """Call GigaChat client async method."""
        return await client.achat(chat_params)

    async def _prepare_functions(self, session: AsyncSession, interview_id: str):
        """Prepare functions for GigaChat.

        The "finish_interview" function is exposed to the model only when the
        conversation has at least MIN_MESSAGES_FOR_FINISH_FUNCTION messages.
        """
        # Count messages for gating the finish_interview function exposure
        messages_count = await session.scalar(
            select(func.count())
            .select_from(InterviewMessage)
            .where(InterviewMessage.interview_id == interview_id)
        )
        messages_count = int(messages_count or 0)
        if messages_count < MIN_MESSAGES_FOR_FINISH_FUNCTION:
            return []
        finish_interview = Function(
            name="finish_interview",
            description="Завершает интервью и сохраняет фидбек. НЕ ВЫЗЫВАЙ эту функцию, пока ты не получишь ПОЛНОЕ представление о кандидате.",
            parameters=FunctionParameters(
                type="object",
                properties={
                    "feedback": {
                        "type": "string",
                        "description": "Подробный фидбек по кандидату",
                    },
                    "positive": {
                        "type": "boolean",
                        "description": "Положительный ли фидбек",
                    },
                },
                required=["feedback", "positive"],
            ),
        )
        return [finish_interview]

    async def list_messages(
        self, session: AsyncSession, interview_id: str
    ) -> List[InterviewMessage]:
        """Get all messages for an interview."""
        interview = await session.get(Interview, interview_id)
        if not interview:
            raise NotFoundError("Interview not found")

        result = await session.scalars(
            select(InterviewMessage)
            # Filter out first system message
            .where(InterviewMessage.interview_id == interview_id).order_by(
                InterviewMessage.index
            )
        )
        return list(result)

    async def create_message(
        self,
        session: AsyncSession,
        interview_id: str,
        payload: InterviewMessageCreateRequest,
    ) -> List[InterviewMessage]:
        """Create a new user message and get AI response."""
        logger.info(f"Creating message for interview {interview_id}")
        interview = await session.get(Interview, interview_id)
        if not interview:
            raise NotFoundError("Interview not found")

        # State-based restrictions
        # If interview not started with first message, block posting user messages
        if getattr(interview, "state", "initialized") == "initialized":
            raise ConflictError(
                "Interview not started. Initialize first message before chatting"
            )

        # Do not allow new messages if interview already completed/done
        if (
            getattr(interview, "state", None) == "done"
            or interview.status == "completed"
        ):
            raise ConflictError("Interview already completed")

        # Get next index for user message
        next_index_result = await session.execute(
            select(func.coalesce(func.max(InterviewMessage.index), -1) + 1).where(
                InterviewMessage.interview_id == interview_id
            )
        )
        next_index = next_index_result.scalar_one()

        # Create user message
        user_message = InterviewMessage(
            interview_id=interview_id,
            index=next_index,
            text=payload.text,
            type=InterviewMessageType.USER,
        )
        session.add(user_message)
        await session.commit()
        await session.flush()  # Flush to get the user message saved

        try:
            # Get AI response from GigaChat
            ai_response = await self._get_ai_response(
                session, interview_id, payload.text
            )

            # Create AI response message
            ai_message = InterviewMessage(
                interview_id=interview_id,
                index=next_index + 1,
                text=ai_response,
                type=InterviewMessageType.ASSISTANT,
            )
            session.add(ai_message)

        except Exception as e:
            logger.error(f"Failed to get AI response: {e}", exc_info=True)
            # Create fallback message
            fallback_message = InterviewMessage(
                interview_id=interview_id,
                index=next_index + 1,
                text="Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.",
                type=InterviewMessageType.ASSISTANT,
            )
            session.add(fallback_message)

        await session.commit()

        # Return updated list of messages
        return await self.list_messages(session, interview_id)

    async def _get_ai_response(
        self, session: AsyncSession, interview_id: str, user_message: str
    ) -> str:
        """Get AI response from GigaChat based on conversation history."""
        try:
            # Get conversation history
            messages = await self.list_messages(session, interview_id)

            # Prepare messages for GigaChat
            gigachat_messages = []
            for msg in messages:
                if msg.type == InterviewMessageType.SYSTEM:
                    gigachat_messages.append(
                        {"role": MessagesRole.SYSTEM, "content": msg.text}
                    )
                elif msg.type == InterviewMessageType.USER:
                    gigachat_messages.append(
                        {"role": MessagesRole.USER, "content": msg.text}
                    )
                elif msg.type == InterviewMessageType.ASSISTANT:
                    gigachat_messages.append(
                        {"role": MessagesRole.ASSISTANT, "content": msg.text}
                    )

            # Add current user message
            gigachat_messages.append(
                {"role": MessagesRole.USER, "content": user_message}
            )

            # Get GigaChat client and make request
            client = await self._get_gigachat_client()

            logger.info(f"Sending {len(gigachat_messages)} messages to GigaChat")

            chat_params = {
                "messages": gigachat_messages,
                "functions": await self._prepare_functions(session, interview_id),
                "temperature": GIGACHAT_TEMPERATURE,
                "max_tokens": GIGACHAT_MAX_TOKENS,
                "stream": False,
            }
            response = await self._call_gigachat_async(client, chat_params)

            choice = response.choices[0]
            message = choice.message

            # Handle function_call finish
            finish_reason = getattr(choice, "finish_reason", None)
            logger.debug(
                "Finish reason evaluated: %s; function_call present: %s",
                finish_reason,
                bool(getattr(message, "function_call", None)),
            )
            if finish_reason == "function_call" and getattr(
                message, "function_call", None
            ):
                function_call = message.function_call
                func_name = getattr(function_call, "name", None)
                func_args = getattr(function_call, "arguments", {})
                logger.info(
                    "GigaChat requested function_call '%s' for interview %s",
                    func_name,
                    interview_id,
                )
                try:
                    # arguments may be dict or JSON string
                    if isinstance(func_args, str):
                        import json

                        func_args = json.loads(func_args)
                except Exception:  # pragma: no cover - safe fallback
                    func_args = {}
                logger.debug(
                    "function_call arguments type=%s", type(func_args).__name__
                )

                if func_name == "finish_interview":
                    # Guard: skip handling finish_interview if not enough messages yet
                    messages_count = await session.scalar(
                        select(func.count())
                        .select_from(InterviewMessage)
                        .where(InterviewMessage.interview_id == interview_id)
                    )
                    messages_count = int(messages_count or 0)
                    if messages_count < MIN_MESSAGES_FOR_FINISH_FUNCTION:
                        logger.info(
                            "Skipping finish_interview for interview %s: messages_count=%s < min=%s",
                            interview_id,
                            messages_count,
                            MIN_MESSAGES_FOR_FINISH_FUNCTION,
                        )
                        return "Спасибо! Давайте продолжим интервью, чтобы собрать достаточно информации перед завершением."
                    feedback = func_args.get("feedback")
                    positive = func_args.get("positive")
                    logger.info(
                        "Handling finish_interview for interview %s (positive=%s, feedback_len=%s)",
                        interview_id,
                        positive,
                        len(feedback) if isinstance(feedback, str) else 0,
                    )

                    interview = await session.get(Interview, interview_id)
                    if not interview:
                        logger.warning(
                            "Interview %s not found while finishing",
                            interview_id,
                        )
                        raise NotFoundError("Interview not found")

                    interview.status = "completed"
                    # Mark interview as done/read-only
                    interview.state = "done"
                    interview.feedback = feedback
                    interview.feedback_positive = (
                        bool(positive) if positive is not None else None
                    )
                    await session.commit()

                    logger.info(
                        "Interview %s marked completed with feedback.", interview_id
                    )
                else:
                    logger.warning(
                        "Unhandled function_call '%s' for interview %s",
                        func_name,
                        interview_id,
                    )

                    # Return a closing assistant message
                    return (
                        "Спасибо за беседу! Интервью завершено. "
                        "HR-команда свяжется с вами по результатам."
                    )

            # Default: return normal assistant content
            ai_response = message.content
            logger.info(f"Received AI response: {ai_response[:100]}...")

            return ai_response

        except Exception as e:
            logger.error(f"GigaChat API error: {e}", exc_info=True)
            raise

    async def initialize_conversation(
        self, session: AsyncSession, interview_id: str
    ) -> List[InterviewMessage]:
        """Initialize conversation with system prompt and first AI message."""
        interview = await session.get(Interview, interview_id)
        if not interview:
            raise NotFoundError("Interview not found")

        # Allow initialization only for newly created interviews
        if getattr(interview, "state", "initialized") != "initialized":
            raise ConflictError("Interview already started or finished")

        # Check if conversation already exists
        existing = await session.scalar(
            select(func.count())
            .select_from(InterviewMessage)
            .where(InterviewMessage.interview_id == interview_id)
        )
        if existing and int(existing) > 0:
            raise ConflictError("Conversation already initialized")

        # Get candidate and vacancy info
        candidate = await session.get(Candidate, interview.candidate_id)
        if not candidate:
            raise NotFoundError("Candidate not found for interview")

        vacancy: Vacancy | None = None
        if interview.vacancy_id is not None:
            vacancy = await session.get(Vacancy, interview.vacancy_id)

        # Create system prompt
        system_prompt = self._create_system_prompt(candidate, vacancy)

        # Store system prompt as first message
        system_message = InterviewMessage(
            interview_id=interview_id,
            index=0,
            text=system_prompt,
            type=InterviewMessageType.SYSTEM,
        )
        session.add(system_message)
        await session.flush()

        try:
            # Get initial AI greeting
            initial_greeting = await self._get_initial_greeting(system_prompt)

            # Create initial AI message
            initial_message = InterviewMessage(
                interview_id=interview_id,
                index=1,
                text=initial_greeting,
                type=InterviewMessageType.ASSISTANT,
            )
            session.add(initial_message)

        except Exception as e:
            logger.error(f"Failed to get initial greeting: {e}", exc_info=True)
            # Use fallback greeting
            fallback_greeting = (
                "Здравствуйте! Я виртуальный HR-ассистент. "
                "Готовы начать интервью? Расскажите немного о себе."
            )
            initial_message = InterviewMessage(
                interview_id=interview_id,
                index=1,
                text=fallback_greeting,
                type=InterviewMessageType.ASSISTANT,
            )
            session.add(initial_message)

        # After first message, mark interview as in progress
        interview.state = "in_progress"
        await session.commit()

        # Return all messages
        return await self.list_messages(session, interview_id)

    def _create_system_prompt(
        self, candidate: Candidate, vacancy: Vacancy | None
    ) -> str:
        """Create system prompt for the interview."""

        # Helpers for safe extraction and formatting of fields
        def to_list(value) -> list:
            if value is None:
                return []
            if isinstance(value, list):
                return value
            if isinstance(value, str):
                try:
                    import json

                    parsed = json.loads(value)
                    return parsed if isinstance(parsed, list) else [value]
                except Exception:
                    return [item.strip() for item in value.split(",") if item.strip()]
            return [str(value)]

        def join_list(values: list) -> str:
            if not values:
                return "не указано"
            return ", ".join(str(v) for v in values if v is not None and str(v).strip())

        def format_experience(value) -> str:
            items = to_list(value)
            if not items:
                return "не указано"
            formatted = []
            for item in items:
                if isinstance(item, dict):
                    company = item.get("company") or "?"
                    position = item.get("position") or "?"
                    years = item.get("years")
                    years_str = f"{years} лет" if years not in (None, "") else "?"
                    formatted.append(f"• {company}, {position}, {years_str}")
                else:
                    formatted.append(f"• {item}")
            return "\n".join(formatted)

        def format_education(value) -> str:
            items = to_list(value)
            if not items:
                return "не указано"
            formatted = []
            for item in items:
                if isinstance(item, dict):
                    org = item.get("organization") or "?"
                    spec = item.get("speciality") or "?"
                    typ = item.get("type")
                    if typ:
                        formatted.append(f"• {org} — {spec} ({typ})")
                    else:
                        formatted.append(f"• {org} — {spec}")
                else:
                    formatted.append(f"• {item}")
            return "\n".join(formatted)

        def format_salary(min_val, max_val) -> str:
            if min_val and max_val:
                return f"{min_val}–{max_val}"
            if min_val and not max_val:
                return f"от {min_val}"
            if max_val and not min_val:
                return f"до {max_val}"
            return "не указано"

        # Candidate fields
        c_name = getattr(candidate, "name", None) or "не указан"
        c_email = getattr(candidate, "email", None) or "не указан"
        c_position = getattr(candidate, "position", None) or "не указана"
        c_status = getattr(candidate, "status", None) or "не указан"
        c_geo = getattr(candidate, "geo", None) or "не указано"
        c_employment_type = getattr(candidate, "employment_type", None) or "не указан"
        c_skills = join_list(to_list(getattr(candidate, "skills", None)))
        c_tech = join_list(to_list(getattr(candidate, "tech", None)))
        c_experience_block = format_experience(getattr(candidate, "experience", None))
        c_education_block = format_education(getattr(candidate, "education", None))

        candidate_block = (
            "Информация о кандидате:\n"
            f"- Имя: {c_name}\n"
            f"- Email: {c_email}\n"
            f"- Позиция: {c_position}\n"
            f"- Статус: {c_status}\n"
            f"- Гео: {c_geo}\n"
            f"- Тип занятости: {c_employment_type}\n"
            f"- Навыки: {c_skills}\n"
            f"- Техстек: {c_tech}\n"
            f"- Опыт:\n{c_experience_block}\n"
            f"- Образование:\n{c_education_block}\n"
        )

        # Vacancy fields
        if vacancy is not None:
            v_title = getattr(vacancy, "title", None) or "не указана"
            v_company = getattr(vacancy, "company", None) or "не указана"
            v_location = getattr(vacancy, "location", None) or "не указана"
            v_status = getattr(vacancy, "status", None) or "не указан"
            v_employment_type = getattr(vacancy, "employment_type", None) or "не указан"
            v_experience_level = (
                getattr(vacancy, "experience_level", None) or "не указан"
            )
            v_salary = format_salary(
                getattr(vacancy, "salary_min", None),
                getattr(vacancy, "salary_max", None),
            )
            v_requirements = getattr(vacancy, "requirements", None) or "не указано"
            v_benefits = getattr(vacancy, "benefits", None) or "не указано"
            v_description = getattr(vacancy, "description", None) or "не указано"
            v_domain = getattr(vacancy, "domain", None) or "не указан"
            v_education = getattr(vacancy, "education", None) or "не указано"
            v_company_info = getattr(vacancy, "company_info", None) or "не указано"
            v_skills = join_list(to_list(getattr(vacancy, "skills", None)))
            v_minor_skills = join_list(to_list(getattr(vacancy, "minor_skills", None)))
            v_responsibilities = join_list(
                to_list(getattr(vacancy, "responsibilities", None))
            )

            vacancy_block = (
                "Информация о вакансии:\n"
                f"- Название: {v_title}\n"
                f"- Компания: {v_company}\n"
                f"- Локация: {v_location}\n"
                f"- Статус вакансии: {v_status}\n"
                f"- Уровень: {v_experience_level}\n"
                f"- Тип занятости: {v_employment_type}\n"
                f"- Зарплата: {v_salary}\n"
                f"- Навыки: {v_skills}\n"
                f"- Доп. навыки: {v_minor_skills}\n"
                f"- Обязанности: {v_responsibilities}\n"
                f"- Домен: {v_domain}\n"
                f"- Требования (текст): {v_requirements}\n"
                f"- Бенефиты: {v_benefits}\n"
                f"- Образование: {v_education}\n"
                f"- Описание: {v_description}\n"
                f"- Информация о компании: {v_company_info}\n"
            )
        else:
            vacancy_block = "Вакансия не указана"

        return f"""
Ты — ассистент HR. Проводишь первичное интервью с кандидатом.

Твоя цель:
- собрать краткую информацию о кандидате,
- оценить его профессиональный опыт,
- проверить знания и умения, специфичные для вакансии,
- оценить коммуникацию и общую культуру

Правила интервью:
1. Всегда начинай с приветствия и короткого объяснения формата (несколько вопросов).
2. Сначала задавай вопросы и получай ответы. Используй стиль живого интервью.
3. НЕ завершай интервью и НЕ вызывай функцию finish_interview, пока:
   - не уточнишь опыт работы и проекты,
   - не проверишь знания ключевых технологий,
   - не спросишь о мотивации и ожиданиях,
   - не оценишь soft skills (коммуникацию, культуру),
   - кандидат не ответит на все вопросы, перечисленные выше.
4. Если кандидат забывает ответить на твой вопрос — повтори его.
5. Ты ведёшь интервью ТОЛЬКО со своей стороны. НИКОГДА не пиши ответы за кандидата. Все ответы кандидата вводятся пользователем. Если информации не хватает — задай уточняющий вопрос, но не придумывай ответ.
6. Только когда собрана вся информация, сделай вывод и вызови finish_interview.
7. Твоё финальное сообщение с вызовом функции finish_interview должно быть коротким (до 100 символов) и не содержать информации о твоих намерениях относительно кандидата. Только прощание и обещание скорого фидбека.

Очень важно: не переходи к финальному шагу раньше времени. Сначала проведи полноценное интервью!

{candidate_block}

{vacancy_block}
"""

    async def _get_initial_greeting(self, system_prompt: str) -> str:
        """Get initial greeting from GigaChat."""
        try:
            client = await self._get_gigachat_client()

            messages = [
                {"role": MessagesRole.SYSTEM, "content": system_prompt},
                {"role": MessagesRole.USER, "content": "Начни интервью с приветствия"},
            ]

            chat_params = {
                "messages": messages,
                "temperature": INITIAL_GREETING_TEMPERATURE,
                "max_tokens": INITIAL_GREETING_MAX_TOKENS,
                "stream": False,
            }
            response = await self._call_gigachat_async(client, chat_params)

            return response.choices[0].message.content

        except Exception as e:
            logger.error(
                f"Failed to get initial greeting from GigaChat: {e}", exc_info=True
            )
            raise


# Create service instance
interview_messages_service = InterviewMessagesService()
