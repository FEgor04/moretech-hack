from gigachat import GigaChat
from app.core.config import settings

def get_gigachat_client():
    return GigaChat(
        credentials=settings.gigachat_credentials,
        verify_ssl_certs=False,
    )