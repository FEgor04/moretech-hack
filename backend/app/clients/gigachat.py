from langchain_gigachat.chat_models import GigaChat

from app.core.config import settings

def get_gigachat_client():
    return GigaChat(
        verify_ssl_certs=False,
        credentials=settings.gigachat_credentials,
    )