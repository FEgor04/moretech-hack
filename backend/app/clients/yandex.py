from speechkit import model_repository
from speechkit.stt import AudioProcessingType, RecognitionModel
from speechkit import configure_credentials, creds
from speechkit.tts import SynthesisModel

from app.core.config import settings


def get_yandex_speech_recognition_model() -> RecognitionModel:
    configure_credentials(
        creds.YandexCredentials(
            api_key=settings.yandex_speech_key,
        )
    )

    model = model_repository.recognition_model()

    model.model = "general"
    model.language = "ru-RU"
    model.audio_processing_type = AudioProcessingType.Full

    return model


def get_yandex_speech_synthesis_client() -> SynthesisModel:
    configure_credentials(
        creds.YandexCredentials(
            api_key=settings.yandex_speech_key,
        )
    )
    model = model_repository.synthesis_model()

    model.voice = "yulduz_ru"
    model.role = "friendly"
    model.unsafe_mode = True

    return model