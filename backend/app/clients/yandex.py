from speechkit import model_repository
from speechkit.stt import AudioProcessingType, RecognitionModel
from speechkit import configure_credentials, creds

from app.core.config import settings

def get_yandex_speech_client() -> RecognitionModel:
    configure_credentials(
        creds.YandexCredentials(
            api_key=settings.yandex_speech_key,
        )
    )


    model = model_repository.recognition_model()

    model.model = 'general'
    model.language = 'ru-RU'
    model.audio_processing_type = AudioProcessingType.Full

    return model