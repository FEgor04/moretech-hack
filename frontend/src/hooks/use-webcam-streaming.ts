import { useEffect, useRef, useState } from "react";
import type Webcam from "react-webcam";
import useWebSocket, { ReadyState } from "react-use-websocket";
import z from "zod";

const socketStateMessageSchema = z.object({
	state: z.enum(["awaiting_user_answer", "speech_recognition", "generating_response", "speech_synthesis"]),
});

type SocketState = z.infer<typeof socketStateMessageSchema>["state"];

export function useWebcamStreaming(
	interviewId: string,
	options?: { disabled?: boolean },
) {
	const webcamRef = useRef<Webcam | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const isDisabled = options?.disabled === true;
	const [socketState, setSocketState] = useState<SocketState | null>("awaiting_user_answer");
	const { sendMessage, readyState, lastMessage } = useWebSocket(
		isDisabled ? null : `/ws/${interviewId}/video`,
		{
			onError: (error) => {
				console.error("WebSocket error connecting to webcam stream:", error);
			},
			onOpen: () => {
				console.log(
					"WebSocket connected to webcam stream for interview:",
					interviewId,
				);
				if (!isDisabled) {
					startRecording();
				}
			},
		},
	);

	// TODO: check if webcam is also ready.
	const isReady = readyState === ReadyState.OPEN;

	function handleDataAvailable(data: BlobEvent) {
		sendMessage(data.data);
	}

	useEffect(() => {
		if (lastMessage) {
			if (lastMessage.data instanceof Blob) {
				// Check if blob is empty or has invalid size
				if (lastMessage.data.size === 0) {
					console.warn("Received empty audio blob, skipping playback");
					return;
				}

				// Log first few bytes to debug format
				const reader = new FileReader();
				reader.onload = () => {
					const arrayBuffer = reader.result as ArrayBuffer;
					const uint8Array = new Uint8Array(arrayBuffer);
					const firstBytes = Array.from(uint8Array.slice(0, 12))
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(" ");
					console.log("Audio blob first bytes (hex):", firstBytes);

					// Check for common audio format headers
					if (firstBytes.startsWith("52 49 46 46")) {
						console.log("Detected WAV format (RIFF header)");
					} else if (
						firstBytes.startsWith("ff fb") ||
						firstBytes.startsWith("ff f3")
					) {
						console.log("Detected MP3 format");
					} else if (firstBytes.startsWith("4f 67 67 53")) {
						console.log("Detected OGG format");
					} else {
						console.warn("Unknown audio format, first bytes:", firstBytes);
					}
				};
				reader.readAsArrayBuffer(lastMessage.data.slice(0, 12));

				// Create audio element if it doesn't exist
				if (!audioRef.current) {
					console.log("Creating new Audio element");
					audioRef.current = new Audio();
				}

				// Create object URL from the blob and play it
				const audioUrl = URL.createObjectURL(lastMessage.data);

				// Set MIME type explicitly if not set
				if (!lastMessage.data.type) {
					// Create a new blob with explicit WAV MIME type
					const wavBlob = new Blob([lastMessage.data], { type: "audio/wav" });
					const wavUrl = URL.createObjectURL(wavBlob);
					audioRef.current.src = wavUrl;
					// Clean up the original URL
					URL.revokeObjectURL(audioUrl);
				} else {
					audioRef.current.src = audioUrl;
				}

				// Add a small delay to ensure the audio element is ready
				setTimeout(() => {
					// Play the audio
					audioRef.current
						?.play()
						.then(() => {
							console.log("Audio playback started successfully");
						})
						.catch((error) => {
							console.error("Error playing audio:", error);

							const fallbackTypes = [
								"audio/wav",
								"audio/mpeg",
								"audio/ogg",
								"audio/mp4",
							];
							let fallbackIndex = 0;

							const tryFallback = () => {
								if (fallbackIndex >= fallbackTypes.length) {
									console.error("All fallback attempts failed");
									return;
								}

								const fallbackType = fallbackTypes[fallbackIndex];

								const fallbackBlob = new Blob([lastMessage.data], {
									type: fallbackType,
								});
								const fallbackUrl = URL.createObjectURL(fallbackBlob);

								// Clean up previous URL
								URL.revokeObjectURL(audioRef.current?.src || "");

								if (!audioRef.current) {
									console.error("Audio element not found");
									return;
								}

								audioRef.current.src = fallbackUrl;

								audioRef.current
									?.play()
									.then(() => {})
									.catch((fallbackError) => {
										console.error(
											`Fallback ${fallbackType} failed:`,
											fallbackError,
										);
										URL.revokeObjectURL(fallbackUrl);
										fallbackIndex++;
										setTimeout(tryFallback, 100);
									});
							};

							setTimeout(tryFallback, 100);
						});
				}, 100);

				// Clean up the object URL after playing
				const currentUrl = audioRef.current.src;
				audioRef.current.addEventListener(
					"ended",
					() => {
						URL.revokeObjectURL(currentUrl);
					},
					{ once: true },
				);
			} else {
				try {
					const parsedData = socketStateMessageSchema.parse(JSON.parse(lastMessage.data));
					setSocketState(parsedData.state);
				}
				catch (error) {
					console.error("Error parsing socket state message:", error);
				}
			}
		}
	}, [lastMessage]);

	// Cleanup audio element on unmount
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.src = "";
			}
		};
	}, []);

	/**
	 * Функция, которую нужно вызывать, когда собеседуемый ответил на вопрос.
	 * В текущей реализации она вызывается когда собеседуемый нажал кнопку "Ответ готов" в чате.
	 *
	 * В будущем ее нужно будет убрать и использовать voice activity detection
	 * https://huggingface.co/models?pipeline_tag=voice-activity-detection
	 */
	function sendAudioReadyMarker() {
		console.log("Sending audio-ready marker");
		sendMessage("audio-ready");
	}

	function startRecording() {
		console.log("Attempting to start recording...");
		setIsRecording(true);
		if (!webcamRef.current || !webcamRef.current.stream) {
			console.log("Webcam not ready, retrying in 100ms...");
			// best fucking practices. try again in 100ms
			return setTimeout(() => {
				startRecording();
			}, 100);
		}

		mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
			mimeType: "video/webm",
		});
		mediaRecorderRef.current.addEventListener(
			"dataavailable",
			handleDataAvailable,
		);
		mediaRecorderRef.current.start(100);
		console.log("Recording started successfully");
	}

	function handleStopRecording() {
		console.log("Stopping recording...");
		setIsRecording(false);
		mediaRecorderRef.current?.stop();
		console.log("Recording stopped");
	}

	return {
		webcamRef,
		isReady,
		isRecording,
		startRecording,
		handleStopRecording,
		sendAudioReadyMarker,
		socketState,
	};
}
