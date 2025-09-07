import asyncio
import logging
import subprocess
from pathlib import Path
import time
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query


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
    
    def handle_audio_marker(self) -> None:
        """Handle audio ready marker by calculating elapsed time and storing it."""
        elapsed_ms = int((time.monotonic() - self.connection_started_monotonic) * 1000)
        self.audio_marker_timings.append(elapsed_ms)
        logger.info(
            "Audio ready marker received for interview %s at %d ms",
            self.interview_id,
            elapsed_ms,
        )

        self.save_interview_video(f".{self.fragment_index}")
        self.fragment_index += 1
    
    def add_video_chunk(self, chunk: bytes) -> None:
        """Add a video chunk to the buffer."""
        self.chunk_index += 1
        self.received_chunks.append(chunk)
        self.total_bytes += len(chunk)
    
    def save_interview_video(self, suffix: str = "") -> None:
        """Save buffered video chunks to file."""
        try:
            if self.total_bytes == 0:
                logger.warning(
                    "No video chunks received for interview %s; nothing to save",
                    self.interview_id,
                )
                return
            
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
                result2 = subprocess.run(
                    cmd_reencode, capture_output=True, text=True
                )
                if result2.returncode != 0:
                    logger.error(
                        "ffmpeg re-encode failed for interview %s: %s",
                        self.interview_id,
                        result2.stderr[-1000:],
                    )
            
            # Cleanup temp file
            try:
                if temp_file_path.exists():
                    temp_file_path.unlink()
            except Exception:
                pass
                
        except Exception:
            logger.exception(
                "Failed to save buffered video for interview %s", self.interview_id
            )
    
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


def get_or_create_interview_service(interview_id: str, prefix: str = "") -> InterviewWebsocketService:
    """Get existing or create new interview service."""
    service_key = f"{prefix}{interview_id}" if prefix else interview_id
    if service_key not in _interview_services:
        _interview_services[service_key] = InterviewWebsocketService(interview_id, prefix)
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
    prefix: str = Query("", description="Optional prefix for file naming")
) -> None:
    await websocket.accept()
    
    # Get or create interview service
    service = get_or_create_interview_service(interview_id, prefix)
    
    logger.info("WS video connection established for interview %s with prefix '%s'", interview_id, prefix)

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
                    service.handle_audio_marker()
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
