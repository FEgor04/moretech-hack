import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


logger = logging.getLogger("app")

router = APIRouter()


RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)


@router.websocket("/ws/{interview_id}/video")
async def websocket_video_stream(websocket: WebSocket, interview_id: str) -> None:
    await websocket.accept()
    file_path = RECORDINGS_DIR / f"{interview_id}.webm"

    logger.info("WS video connection established for interview %s", interview_id)

    # Open file once, append chunks as they arrive
    # Use binary mode and buffering for efficiency
    try:
        with open(file_path, "ab", buffering=0) as f:
            while True:
                try:
                    message = await websocket.receive()
                except WebSocketDisconnect:
                    logger.info("WS video disconnected for interview %s", interview_id)
                    break

                # message can be {"type": "websocket.receive", "bytes": b"..."} or "text"
                data_bytes: bytes | None = None
                if (b := message.get("bytes")) is not None:
                    data_bytes = b
                else:
                    text_data = message.get("text")
                    if text_data is not None:
                        # If client sends base64 or other text, we ignore for now
                        # to avoid corrupting the binary file. In the future, we
                        # could detect and decode. For now just log.
                        logger.warning(
                            "Ignoring text frame on video WS for interview %s (len=%d)",
                            interview_id,
                            len(text_data),
                        )

                if data_bytes:
                    f.write(data_bytes)
                else:
                    # Small pause to avoid hot loop on non-binary frames
                    await asyncio.sleep(0)
    finally:
        logger.info(
            "WS video stream closed for interview %s, file at %s",
            interview_id,
            file_path,
        )
