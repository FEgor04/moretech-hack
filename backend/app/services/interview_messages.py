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

    async def _prepare_functions(self):
        """Prepare functions for GigaChat."""
        finish_interview = Function(
            name="finish_review",
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
            .where(InterviewMessage.interview_id == interview_id)
            .order_by(InterviewMessage.index)
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
                "functions": await self._prepare_functions(),
                "temperature": 0.7,
                "max_tokens": 1000,
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
                func = message.function_call
                func_name = getattr(func, "name", None)
                func_args = getattr(func, "arguments", {})
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

                if func_name == "finish_review":
                    feedback = func_args.get("feedback")
                    positive = func_args.get("positive")
                    logger.info(
                        "Handling finish_review for interview %s (positive=%s, feedback_len=%s)",
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

        return f"""
Ты - HR, проводишь первичное интервью с кандидатом.

Твоя задача - собрать краткую информацию о кандидате,
оценить его профессиональный опыт, проверить его знания и умения,
оценить его коммуникационные навыки и общую культуру.

Будь дружелюбен, профессионален и говори только по-русски.

Начни с приветствия и попроси кандидата рассказать о себе.

В конце интервью вызови функцию finish_review, дав полное мнение о кандидате и
рекомендации по его принятию на работу (True или False).

Информация о кандидате: {candidate}

Информация о вакансии: {vacancy}

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
                "temperature": 0.7,
                "max_tokens": 200,
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
