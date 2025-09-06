import logging
from gigachat import GigaChat
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_gigachat_client():
    try:
        if not settings.gigachat_credentials:
            logger.error("GigaChat credentials are not configured")
            raise ValueError("GigaChat credentials are not configured")
        
        logger.info("Initializing GigaChat client...")
        client = GigaChat(
            credentials=settings.gigachat_credentials,
            verify_ssl_certs=False,
        )
        logger.info("GigaChat client initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize GigaChat client: {e}", exc_info=True)
        raise