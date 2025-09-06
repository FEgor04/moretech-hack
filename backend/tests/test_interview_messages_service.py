import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.interview_messages import InterviewMessagesService
from app.models.interview import Interview
from app.models.candidate import Candidate
from app.models.vacancy import Vacancy
from app.models.interview_message import InterviewMessage, InterviewMessageType
from app.schemas.common import InterviewMessageCreateRequest
from app.services.exceptions import NotFoundError


@pytest.fixture
def interview_messages_service():
    return InterviewMessagesService()


@pytest.fixture
def mock_session():
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def sample_interview():
    interview = Interview()
    interview.id = "test-interview-id"
    interview.candidate_id = "test-candidate-id"
    interview.vacancy_id = 1
    return interview


@pytest.fixture
def sample_candidate():
    candidate = Candidate()
    candidate.id = "test-candidate-id"
    candidate.name = "Иван Иванов"
    candidate.position = "Python Developer"
    candidate.experience = 3
    return candidate


@pytest.fixture
def sample_vacancy():
    vacancy = Vacancy()
    vacancy.id = 1
    vacancy.title = "Senior Python Developer"
    vacancy.description = "Разработка веб-приложений на Python"
    return vacancy


class TestInterviewMessagesService:
    """Test cases for InterviewMessagesService."""

    @pytest.mark.asyncio
    async def test_list_messages_success(self, interview_messages_service, mock_session, sample_interview):
        """Test successful message listing."""
        # Arrange
        interview_id = "test-interview-id"
        mock_session.get.return_value = sample_interview
        
        mock_messages = [
            InterviewMessage(
                interview_id=interview_id,
                index=0,
                text="System prompt",
                type=InterviewMessageType.SYSTEM
            ),
            InterviewMessage(
                interview_id=interview_id,
                index=1,
                text="Hello",
                type=InterviewMessageType.USER
            )
        ]
        
        mock_session.scalars.return_value = mock_messages
        
        # Act
        result = await interview_messages_service.list_messages(mock_session, interview_id)
        
        # Assert
        assert len(result) == 2
        assert result[0].text == "System prompt"
        assert result[1].text == "Hello"
        mock_session.get.assert_called_once_with(Interview, interview_id)

    @pytest.mark.asyncio
    async def test_list_messages_interview_not_found(self, interview_messages_service, mock_session):
        """Test message listing when interview not found."""
        # Arrange
        interview_id = "non-existent-id"
        mock_session.get.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError, match="Interview not found"):
            await interview_messages_service.list_messages(mock_session, interview_id)

    @pytest.mark.asyncio
    @patch('app.services.interview_messages.get_gigachat_client')
    async def test_create_message_success(
        self, 
        mock_get_gigachat_client, 
        interview_messages_service, 
        mock_session, 
        sample_interview
    ):
        """Test successful message creation with AI response."""
        # Arrange
        interview_id = "test-interview-id"
        payload = InterviewMessageCreateRequest(text="Привет!")
        
        mock_session.get.return_value = sample_interview
        
        # Mock the execute result properly
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 2
        mock_session.execute.return_value = mock_result
        
        # Mock GigaChat response
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Привет! Расскажите о себе."
        mock_client.chat.return_value = mock_response
        mock_get_gigachat_client.return_value = mock_client
        
        # Mock existing messages (empty conversation)
        mock_session.scalars.return_value = []
        
        # Act
        result = await interview_messages_service.create_message(mock_session, interview_id, payload)
        
        # Assert
        assert len(result) == 0  # Will be empty since we mocked empty scalars
        mock_session.add.assert_called()
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_message_interview_not_found(
        self, 
        interview_messages_service, 
        mock_session
    ):
        """Test message creation when interview not found."""
        # Arrange
        interview_id = "non-existent-id"
        payload = InterviewMessageCreateRequest(text="Test message")
        mock_session.get.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError, match="Interview not found"):
            await interview_messages_service.create_message(mock_session, interview_id, payload)

    @pytest.mark.asyncio
    @patch('app.services.interview_messages.get_gigachat_client')
    async def test_initialize_conversation_success(
        self,
        mock_get_gigachat_client,
        interview_messages_service,
        mock_session,
        sample_interview,
        sample_candidate,
        sample_vacancy
    ):
        """Test successful conversation initialization."""
        # Arrange
        interview_id = "test-interview-id"
        
        # Mock get calls with proper side effect
        async def mock_get(model, id):
            if model == Interview:
                return sample_interview
            elif model == Candidate:
                return sample_candidate
            elif model == Vacancy:
                return sample_vacancy
            return None
        
        mock_session.get.side_effect = mock_get
        mock_session.scalar.return_value = 0  # No existing messages
        
        # Mock GigaChat response
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Здравствуйте! Готовы начать интервью?"
        mock_client.chat.return_value = mock_response
        mock_get_gigachat_client.return_value = mock_client
        
        # Mock empty messages list
        mock_session.scalars.return_value = []
        
        # Act
        result = await interview_messages_service.initialize_conversation(mock_session, interview_id)
        
        # Assert
        assert len(result) == 0  # Will be empty since we mocked empty scalars
        mock_session.add.assert_called()
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_initialize_conversation_already_exists(
        self,
        interview_messages_service,
        mock_session,
        sample_interview
    ):
        """Test conversation initialization when conversation already exists."""
        # Arrange
        interview_id = "test-interview-id"
        mock_session.get.return_value = sample_interview
        mock_session.scalar.return_value = 1  # Messages already exist
        
        # Act & Assert
        with pytest.raises(ValueError, match="Conversation already initialized"):
            await interview_messages_service.initialize_conversation(mock_session, interview_id)

    def test_create_system_prompt(self, interview_messages_service, sample_candidate, sample_vacancy):
        """Test system prompt creation."""
        # Act
        prompt = interview_messages_service._create_system_prompt(sample_candidate, sample_vacancy)
        
        # Assert
        assert "ассистент HR" in prompt
        assert "Иван Иванов" in prompt
        assert "Python Developer" in prompt
        assert "Senior Python Developer" in prompt
        assert "Разработка веб-приложений" in prompt

    def test_create_system_prompt_no_vacancy(self, interview_messages_service, sample_candidate):
        """Test system prompt creation without vacancy."""
        # Act
        prompt = interview_messages_service._create_system_prompt(sample_candidate, None)
        
        # Assert
        assert "ассистент HR" in prompt
        assert "Иван Иванов" in prompt
        assert "Python Developer" in prompt
        assert "Вакансия не указана" in prompt
