import asyncio
import logging
import subprocess
from pathlib import Path
import time
from typing import Dict, List
import httpx

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.clients.yandex import get_yandex_speech_client


logger = logging.getLogger("app")

router = APIRouter()


RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)


class InterviewWebsocketService:
    """Service to manage WebSocket connections and state for a single interview."""

    def __init__(self, interview_id: str, prefix: str = ""):
        self.interview_id = interview_id
        self.prefix = prefix
        self.connection_started_monotonic = time.monotonic()
        self.audio_marker_timings: List[int] = []
        self.received_chunks: List[bytes] = []
        self.total_bytes = 0
        self.chunk_index = 0
        self.fragment_index = 0

        # File paths
        self.base_filename = f"{prefix}{interview_id}" if prefix else interview_id
        self.file_path = RECORDINGS_DIR / f"{self.base_filename}.webm"
        self.temp_path = RECORDINGS_DIR / f"{self.base_filename}.raw.webm"

    def get_latest_markers(self) -> tuple[int, int]:
        """Get the two latest markers or 0 and latest marker if only one exists."""
        if len(self.audio_marker_timings) == 0:
            return 0, 0
        elif len(self.audio_marker_timings) == 1:
            return 0, self.audio_marker_timings[0]
        else:
            return self.audio_marker_timings[-2], self.audio_marker_timings[-1]

    def cut_fragment_video(self, path: str, start_ms: int, end_ms: int) -> bool:
        """Cut video fragment to only include time between start_ms and end_ms using ffmpeg."""
        # Convert milliseconds to seconds for ffmpeg
        start_sec = start_ms / 1000.0
        end_sec = end_ms / 1000.0
        duration = end_sec - start_sec

        logger.debug(
            "Cutting video %s: start=%dms (%.3fs), end=%dms (%.3fs), duration=%.3fs",
            path,
            start_ms,
            start_sec,
            end_ms,
            end_sec,
            duration,
        )

        if duration <= 0:
            logger.warning(
                "Invalid duration for cutting video %s: start=%dms, end=%dms",
                path,
                start_ms,
                end_ms,
            )
            return False

        # Create temporary file for the cut video with proper extension
        temp_path = f"{path}.tmp.webm"

        # ffmpeg command to cut video
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-i",
            path,  # Input file
            "-ss",
            str(start_sec),  # Start time
            "-t",
            str(duration),  # Duration
            "-c",
            "copy",  # Copy streams without re-encoding
            "-f",
            "webm",  # Explicitly specify output format
            temp_path,
        ]

        logger.debug("Running ffmpeg command: %s", " ".join(cmd))

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            logger.error(
                "ffmpeg cut failed for %s (return code %d): %s",
                path,
                result.returncode,
                result.stderr[-1000:],
            )
            return False

        logger.debug("ffmpeg cut successful for %s", path)

        # Replace original file with cut version
        Path(temp_path).replace(path)
        logger.debug("Replaced original file with cut version: %s", path)
        return True

    def extract_audio_from_video(self, video_path: str) -> str | None:
        """Extract audio from video file and save as WAV with same base filename."""
        # Generate audio file path with .wav extension
        audio_path = video_path.replace(".webm", ".wav")

        logger.debug("Extracting audio from %s to %s", video_path, audio_path)

        # ffmpeg command to extract audio
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-i",
            video_path,  # Input video file
            "-vn",  # No video
            "-acodec",
            "pcm_s16le",  # PCM 16-bit little-endian
            "-ar",
            "16000",  # Sample rate 16kHz
            "-ac",
            "1",  # Mono
            audio_path,
        ]

        logger.debug("Running ffmpeg audio extraction command: %s", " ".join(cmd))

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            logger.error(
                "ffmpeg audio extraction failed for %s (return code %d): %s",
                video_path,
                result.returncode,
                result.stderr[-1000:],
            )
            return None

        logger.debug("Audio extraction successful: %s", audio_path)
        return audio_path

    def recognize_user_answer(self, audio_path: str) -> str:
        """Recognize speech from audio file and return transcribed text."""
        logger.debug("Recognizing speech from audio file: %s", audio_path)

        client = get_yandex_speech_client()
        result = client.transcribe_file(audio_path)
        text = result[0].normalized_text or result[0].raw_text
        logger.info("Speech recognition result: %s", result)
        logger.info("Speech recognition text: %s", text)
        return text

    async def submit_user_answer(self, interview_id: str, text: str) -> bool:
        """Submit user answer to the interview messages endpoint."""
        logger.debug(
            "Submitting user answer for interview %s: %s", interview_id, text
        )

        # Prepare the request payload
        payload = {"text": text}

        # Make POST request to the interview messages endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"http://localhost:8000/interviews/{interview_id}/messages",
                json=payload,
                timeout=30.0,
            )

            if response.status_code == 200:
                logger.info(
                    "Successfully submitted user answer for interview %s",
                    interview_id,
                )
                return True
            else:
                logger.error(
                    "Failed to submit user answer for interview %s: status=%d, response=%s",
                    interview_id,
                    response.status_code,
                    response.text,
                )
                return False

    async def handle_audio_marker(self) -> None:
        """Handle audio ready marker by calculating elapsed time and storing it."""
        elapsed_ms = int((time.monotonic() - self.connection_started_monotonic) * 1000)
        self.audio_marker_timings.append(elapsed_ms)
        logger.info(
            "Audio ready marker received for interview %s at %d ms (total markers: %d)",
            self.interview_id,
            elapsed_ms,
            len(self.audio_marker_timings),
        )

        fragment_path = self.save_interview_video(f".{self.fragment_index}")
        self.fragment_index += 1

        if not fragment_path:
            logger.warning(
                "Failed to save interview video for interview %s", self.interview_id
            )
            return

        # Get the two latest markers
        start_ms, end_ms = self.get_latest_markers()
        logger.debug(
            "Using markers for cutting: start=%dms, end=%dms (all markers: %s)",
            start_ms,
            end_ms,
            self.audio_marker_timings,
        )

        # Cut the fragment video to only include time between markers
        if not self.cut_fragment_video(fragment_path, start_ms, end_ms):
            logger.warning("Failed to cut fragment: %s", fragment_path)
            return

        logger.info("Fragment cut successfully: %s", fragment_path)

        audio_path = self.extract_audio_from_video(fragment_path)
        if not audio_path:
            logger.warning("Failed to extract audio from: %s", fragment_path)
            return

        logger.info("Audio extracted successfully: %s", audio_path)

        # Recognize speech from the audio
        recognized_text = self.recognize_user_answer(audio_path)
        if not recognized_text:
            logger.warning("Failed to recognize speech from: %s", audio_path)
            return

        logger.info("User said: %s", recognized_text)

        # Submit the recognized text to the interview messages endpoint
        if not await self.submit_user_answer(self.interview_id, recognized_text):
            logger.warning(
                "Failed to submit user answer for interview %s", self.interview_id
            )
            return

        logger.info(
            "User answer submitted successfully for interview %s", self.interview_id
        )

    def add_video_chunk(self, chunk: bytes) -> None:
        """Add a video chunk to the buffer."""
        self.chunk_index += 1
        self.received_chunks.append(chunk)
        self.total_bytes += len(chunk)

    def save_interview_video(self, suffix: str = "") -> str | None:
        """Save buffered video chunks to file and return the path to the saved file."""
        if self.total_bytes == 0:
            logger.warning(
                "No video chunks received for interview %s; nothing to save",
                self.interview_id,
            )
            return None

        # Generate file paths with suffix
        temp_file_path = RECORDINGS_DIR / f"{self.base_filename}{suffix}.raw.webm"
        final_file_path = RECORDINGS_DIR / f"{self.base_filename}{suffix}.webm"

        # Write all chunks to temp file
        with open(temp_file_path, "wb") as f:
            for chunk in self.received_chunks:
                f.write(chunk)

        # Try remux (copy) first
        cmd_copy = [
            "ffmpeg",
            "-y",
            "-i",
            str(temp_file_path),
            "-c",
            "copy",
            str(final_file_path),
        ]
        result = subprocess.run(cmd_copy, capture_output=True, text=True)

        if result.returncode != 0:
            logger.warning(
                "ffmpeg remux copy failed for interview %s: %s",
                self.interview_id,
                result.stderr[-1000:],
            )
            # Fallback to re-encode
            cmd_reencode = [
                "ffmpeg",
                "-y",
                "-i",
                str(temp_file_path),
                "-c:v",
                "libvpx-vp9",
                "-c:a",
                "libopus",
                str(final_file_path),
            ]
            result2 = subprocess.run(cmd_reencode, capture_output=True, text=True)
            if result2.returncode != 0:
                logger.error(
                    "ffmpeg re-encode failed for interview %s: %s",
                    self.interview_id,
                    result2.stderr[-1000:],
                )
                return None

        # Cleanup temp file
        try:
            if temp_file_path.exists():
                temp_file_path.unlink()
        except Exception as e:
            logger.warning("Failed to cleanup temp file %s: %s", temp_file_path, e)

        return str(final_file_path)

    def cleanup(self) -> None:
        """Clean up resources and save video."""
        self.save_interview_video()
        logger.info(
            "WS video stream closed for interview %s, file at %s",
            self.interview_id,
            self.file_path,
        )


# Global registry of active interview services
_interview_services: Dict[str, InterviewWebsocketService] = {}


def get_or_create_interview_service(
    interview_id: str, prefix: str = ""
) -> InterviewWebsocketService:
    """Get existing or create new interview service."""
    service_key = f"{prefix}{interview_id}" if prefix else interview_id
    if service_key not in _interview_services:
        _interview_services[service_key] = InterviewWebsocketService(
            interview_id, prefix
        )
    return _interview_services[service_key]


def cleanup_interview_service(interview_id: str, prefix: str = "") -> None:
    """Clean up and remove interview service."""
    service_key = f"{prefix}{interview_id}" if prefix else interview_id
    if service_key in _interview_services:
        service = _interview_services[service_key]
        service.cleanup()
        del _interview_services[service_key]


@router.websocket("/ws/{interview_id}/video")
async def websocket_video_stream(
    websocket: WebSocket,
    interview_id: str,
    prefix: str = Query("", description="Optional prefix for file naming"),
) -> None:
    await websocket.accept()

    # Get or create interview service
    service = get_or_create_interview_service(interview_id, prefix)

    logger.info(
        "WS video connection established for interview %s with prefix '%s'",
        interview_id,
        prefix,
    )

    # Receive binary chunks and store them as individual files for later concatenation
    try:
        while True:
            try:
                message = await websocket.receive()
            except WebSocketDisconnect:
                logger.info("WS video disconnected for interview %s", interview_id)
                break
            except RuntimeError as exc:  # Starlette raises this after a disconnect
                if (
                    'Cannot call "receive" once a disconnect message has been received'
                    in str(exc)
                ):
                    logger.info("WS video disconnected for interview %s", interview_id)
                    break
                raise

            # message can be {"type": "websocket.receive", "bytes": b"..."} or "text"
            data_bytes: bytes | None = None
            if (b := message.get("bytes")) is not None:
                data_bytes = b
            else:
                text_data = message.get("text")
                if text_data == "audio-ready":
                    await service.handle_audio_marker()
                    continue
                if text_data is not None:
                    logger.warning(
                        "Ignoring text frame on video WS for interview %s (len=%d)",
                        interview_id,
                        len(text_data),
                    )

            if data_bytes and len(data_bytes) > 0:
                service.add_video_chunk(data_bytes)
            else:
                # Small pause to avoid hot loop on non-binary frames
                await asyncio.sleep(0)
    finally:
        cleanup_interview_service(interview_id, prefix)
