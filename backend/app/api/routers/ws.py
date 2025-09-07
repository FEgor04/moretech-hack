import asyncio
import logging
import subprocess
from pathlib import Path
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


logger = logging.getLogger("app")

router = APIRouter()


RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

# Global store for audio marker timings (ms since WS connection start) per interview
AUDIO_MARKER_TIMINGS: dict[str, list[int]] = {}


@router.websocket("/ws/{interview_id}/video")
async def websocket_video_stream(websocket: WebSocket, interview_id: str) -> None:
    await websocket.accept()
    connection_started_monotonic = time.monotonic()
    file_path = RECORDINGS_DIR / f"{interview_id}.webm"
    temp_path = RECORDINGS_DIR / f"{interview_id}.raw.webm"
    chunk_index = 0
    received_chunks: list[bytes] = []
    total_bytes = 0

    logger.info("WS video connection established for interview %s", interview_id)

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
                    # Calculate elapsed time in ms since WS connection start and store globally
                    elapsed_ms = int((time.monotonic() - connection_started_monotonic) * 1000)
                    AUDIO_MARKER_TIMINGS.setdefault(interview_id, []).append(elapsed_ms)
                    logger.info(
                        "Audio ready marker received for interview %s at %d ms",
                        interview_id,
                        elapsed_ms,
                    )
                    continue
                if text_data is not None:
                    logger.warning(
                        "Ignoring text frame on video WS for interview %s (len=%d)",
                        interview_id,
                        len(text_data),
                    )

            if data_bytes and len(data_bytes) > 0:
                chunk_index += 1
                received_chunks.append(data_bytes)
                total_bytes += len(data_bytes)
            else:
                # Small pause to avoid hot loop on non-binary frames
                await asyncio.sleep(0)
    finally:
        # Save buffered bytes to temp file and remux to final
        try:
            if total_bytes == 0:
                logger.warning(
                    "No video chunks received for interview %s; nothing to save",
                    interview_id,
                )
            else:
                with open(temp_path, "wb") as f:
                    for part in received_chunks:
                        f.write(part)
                # Try remux (copy) first
                cmd_copy = [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(temp_path),
                    "-c",
                    "copy",
                    str(file_path),
                ]
                result = subprocess.run(cmd_copy, capture_output=True, text=True)
                if result.returncode != 0:
                    logger.warning(
                        "ffmpeg remux copy failed for interview %s: %s",
                        interview_id,
                        result.stderr[-1000:],
                    )
                    # Fallback to re-encode
                    cmd_reencode = [
                        "ffmpeg",
                        "-y",
                        "-i",
                        str(temp_path),
                        "-c:v",
                        "libvpx-vp9",
                        "-c:a",
                        "libopus",
                        str(file_path),
                    ]
                    result2 = subprocess.run(
                        cmd_reencode, capture_output=True, text=True
                    )
                    if result2.returncode != 0:
                        logger.error(
                            "ffmpeg re-encode failed for interview %s: %s",
                            interview_id,
                            result2.stderr[-1000:],
                        )
                # Cleanup temp
                try:
                    if temp_path.exists():
                        temp_path.unlink()
                except Exception:
                    pass
        except Exception:
            logger.exception(
                "Failed to save buffered video for interview %s", interview_id
            )

        logger.info(
            "WS video stream closed for interview %s, file at %s",
            interview_id,
            file_path,
        )
