import pytest
from unittest.mock import Mock
from app.services.pdf_parser import PDFParserService, PDFParsingError


class TestPDFParserService:
    """Test PDF parser service with GigaChat integration"""

    def test_parse_cv_success(self):
        """Test successful CV parsing with GigaChat"""
        # Mock GigaChat client
        mock_client = Mock()
        mock_file_response = Mock()
        mock_file_response.id = "test-file-id-123"
        mock_client.upload_file.return_value = mock_file_response

        mock_chat_response = Mock()
        mock_choice = Mock()
        mock_choice.message.content = '{"name": "John Doe", "email": "john@example.com", "position": "Software Engineer", "experience": 5}'
        mock_chat_response.choices = [mock_choice]
        mock_client.chat.return_value = mock_chat_response

        # Create parser service with mocked client
        parser = PDFParserService()
        parser.gigachat_client = mock_client

        # Test CV parsing
        import io

        pdf_content = b"fake pdf content"
        pdf_file = io.BytesIO(pdf_content)

        candidate, file_id = parser.parse_cv(pdf_file, "test.pdf")

        # Verify results
        assert candidate.name == "John Doe"
        assert candidate.email == "john@example.com"
        assert candidate.position == "Software Engineer"
        assert candidate.experience == 5
        assert candidate.gigachat_file_id == "test-file-id-123"
        assert file_id == "test-file-id-123"

        # Verify GigaChat client was called correctly
        mock_client.upload_file.assert_called_once_with(pdf_file)
        mock_client.chat.assert_called_once()

    def test_parse_vacancy_success(self):
        """Test successful vacancy parsing with GigaChat"""
        # Mock GigaChat client
        mock_client = Mock()
        mock_file_response = Mock()
        mock_file_response.id = "test-vacancy-id-456"
        mock_client.upload_file.return_value = mock_file_response

        mock_chat_response = Mock()
        mock_choice = Mock()
        mock_choice.message.content = (
            '{"title": "Senior Developer", "description": "We need a senior developer"}'
        )
        mock_chat_response.choices = [mock_choice]
        mock_client.chat.return_value = mock_chat_response

        # Create parser service with mocked client
        parser = PDFParserService()
        parser.gigachat_client = mock_client

        # Test vacancy parsing
        import io

        pdf_content = b"fake vacancy pdf content"
        pdf_file = io.BytesIO(pdf_content)

        vacancy, file_id = parser.parse_vacancy(pdf_file, "vacancy.pdf")

        # Verify results
        assert vacancy.title == "Senior Developer"
        assert vacancy.description == "We need a senior developer"
        assert vacancy.gigachat_file_id == "test-vacancy-id-456"
        assert file_id == "test-vacancy-id-456"

        # Verify GigaChat client was called correctly
        mock_client.upload_file.assert_called_once_with(pdf_file)
        mock_client.chat.assert_called_once()

    def test_analyze_cv_with_gigachat(self):
        """Test CV analysis using stored file ID"""
        # Mock GigaChat client
        mock_client = Mock()
        mock_chat_response = Mock()
        mock_choice = Mock()
        mock_choice.message.content = (
            "This candidate has 5 years of experience in Python and FastAPI."
        )
        mock_chat_response.choices = [mock_choice]
        mock_client.chat.return_value = mock_chat_response

        # Create parser service with mocked client
        parser = PDFParserService()
        parser.gigachat_client = mock_client

        # Test analysis
        result = parser.analyze_cv_with_gigachat(
            "test-file-id-123", "What are this candidate's main skills?"
        )

        # Verify result
        assert (
            result == "This candidate has 5 years of experience in Python and FastAPI."
        )

        # Verify GigaChat client was called correctly
        mock_client.chat.assert_called_once()
        call_args = mock_client.chat.call_args[0][0]
        assert call_args["messages"][0]["attachments"] == ["test-file-id-123"]
        assert (
            call_args["messages"][0]["content"]
            == "What are this candidate's main skills?"
        )

    def test_analyze_vacancy_with_gigachat(self):
        """Test vacancy analysis using stored file ID"""
        # Mock GigaChat client
        mock_client = Mock()
        mock_chat_response = Mock()
        mock_choice = Mock()
        mock_choice.message.content = "This position requires 3+ years of Python experience and knowledge of FastAPI."
        mock_chat_response.choices = [mock_choice]
        mock_client.chat.return_value = mock_chat_response

        # Create parser service with mocked client
        parser = PDFParserService()
        parser.gigachat_client = mock_client

        # Test analysis
        result = parser.analyze_vacancy_with_gigachat(
            "test-vacancy-id-456", "What are the main requirements for this position?"
        )

        # Verify result
        assert (
            result
            == "This position requires 3+ years of Python experience and knowledge of FastAPI."
        )

        # Verify GigaChat client was called correctly
        mock_client.chat.assert_called_once()
        call_args = mock_client.chat.call_args[0][0]
        assert call_args["messages"][0]["attachments"] == ["test-vacancy-id-456"]
        assert (
            call_args["messages"][0]["content"]
            == "What are the main requirements for this position?"
        )

    def test_parse_cv_json_error(self):
        """Test CV parsing with invalid JSON response"""
        # Mock GigaChat client
        mock_client = Mock()
        mock_file_response = Mock()
        mock_file_response.id = "test-file-id-123"
        mock_client.upload_file.return_value = mock_file_response

        mock_chat_response = Mock()
        mock_choice = Mock()
        mock_choice.message.content = "Invalid JSON response"
        mock_chat_response.choices = [mock_choice]
        mock_client.chat.return_value = mock_chat_response

        # Create parser service with mocked client
        parser = PDFParserService()
        parser.gigachat_client = mock_client

        # Test CV parsing with invalid JSON
        import io

        pdf_content = b"fake pdf content"
        pdf_file = io.BytesIO(pdf_content)

        with pytest.raises(PDFParsingError, match="Failed to parse CV"):
            parser.parse_cv(pdf_file, "test.pdf")


if __name__ == "__main__":
    pytest.main([__file__])
