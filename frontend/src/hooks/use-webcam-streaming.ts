import { useEffect, useRef, useState } from "react";
import type Webcam from "react-webcam";
import useWebSocket, { ReadyState } from "react-use-websocket";

export function useWebcamStreaming(interviewId: string) {
	const webcamRef = useRef<Webcam | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const { sendMessage, readyState, lastMessage } = useWebSocket(`/ws/${interviewId}/video`, {
		onError: (error) => {
			console.error("WebSocket error connecting to webcam stream:", error);
		},
		onOpen: () => {
			console.log("WebSocket connected to webcam stream for interview:", interviewId);
			startRecording();
		},
		onClose: (event) => {
			console.log("WebSocket connection closed:", {
				code: event.code,
				reason: event.reason,
				wasClean: event.wasClean,
				timestamp: new Date().toISOString()
			});
		},
		onMessage: (event) => {
			console.log("WebSocket message received (raw):", {
				type: typeof event.data,
				isBlob: event.data instanceof Blob,
				size: event.data instanceof Blob ? event.data.size : event.data.length,
				timestamp: new Date().toISOString()
			});
		}
	});

	// TODO: check if webcam is also ready.
	const isReady = readyState === ReadyState.OPEN;

	function handleDataAvailable(data: BlobEvent) {
		sendMessage(data.data);
	}

	useEffect(() => {
		if (lastMessage) {
			console.log("WebSocket message received:", {
				type: typeof lastMessage.data,
				isBlob: lastMessage.data instanceof Blob,
				size: lastMessage.data instanceof Blob ? lastMessage.data.size : 'N/A',
				timestamp: new Date().toISOString()
			});

			if (lastMessage.data instanceof Blob) {
				console.log("Processing audio blob:", {
					size: lastMessage.data.size,
					type: lastMessage.data.type,
					url: 'blob://...'
				});

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
					const firstBytes = Array.from(uint8Array.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' ');
					console.log("Audio blob first bytes (hex):", firstBytes);
					
					// Check for common audio format headers
					if (firstBytes.startsWith('52 49 46 46')) {
						console.log("Detected WAV format (RIFF header)");
					} else if (firstBytes.startsWith('ff fb') || firstBytes.startsWith('ff f3')) {
						console.log("Detected MP3 format");
					} else if (firstBytes.startsWith('4f 67 67 53')) {
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
					
					// Add event listeners for debugging
					audioRef.current.addEventListener('loadstart', () => {
						console.log("Audio: loadstart event");
					});
					audioRef.current.addEventListener('loadeddata', () => {
						console.log("Audio: loadeddata event");
					});
					audioRef.current.addEventListener('canplay', () => {
						console.log("Audio: canplay event");
					});
					audioRef.current.addEventListener('play', () => {
						console.log("Audio: play event started");
					});
					audioRef.current.addEventListener('ended', () => {
						console.log("Audio: ended event");
					});
					audioRef.current.addEventListener('error', (e) => {
						console.error("Audio: error event", e);
					});
				}
				
				// Create object URL from the blob and play it
				const audioUrl = URL.createObjectURL(lastMessage.data);
				console.log("Created object URL:", audioUrl);
				
				// Set MIME type explicitly if not set
				if (!lastMessage.data.type) {
					console.log("Blob has no MIME type, assuming WAV format");
					// Create a new blob with explicit WAV MIME type
					const wavBlob = new Blob([lastMessage.data], { type: 'audio/wav' });
					const wavUrl = URL.createObjectURL(wavBlob);
					audioRef.current.src = wavUrl;
					// Clean up the original URL
					URL.revokeObjectURL(audioUrl);
					console.log("Set audio source with WAV MIME type, attempting to play...");
				} else {
					audioRef.current.src = audioUrl;
					console.log("Set audio source, attempting to play...");
				}
				
				// Add a small delay to ensure the audio element is ready
				setTimeout(() => {
					// Play the audio
					audioRef.current?.play()
						.then(() => {
							console.log("Audio playback started successfully");
						})
						.catch((error) => {
							console.error("Error playing audio:", error);
							console.error("Audio element state:", {
								readyState: audioRef.current?.readyState,
								networkState: audioRef.current?.networkState,
								src: audioRef.current?.src,
								error: audioRef.current?.error
							});
							
							// Try fallback with different MIME types
							console.log("Attempting fallback with different MIME types...");
							const fallbackTypes = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4'];
							let fallbackIndex = 0;
							
							const tryFallback = () => {
								if (fallbackIndex >= fallbackTypes.length) {
									console.error("All fallback attempts failed");
									return;
								}
								
								const fallbackType = fallbackTypes[fallbackIndex];
								console.log(`Trying fallback with MIME type: ${fallbackType}`);
								
								const fallbackBlob = new Blob([lastMessage.data], { type: fallbackType });
								const fallbackUrl = URL.createObjectURL(fallbackBlob);
								
								// Clean up previous URL
								URL.revokeObjectURL(audioRef.current?.src || '');
								
								audioRef.current!.src = fallbackUrl;
								
								audioRef.current?.play()
									.then(() => {
										console.log(`Audio playback successful with fallback type: ${fallbackType}`);
									})
									.catch((fallbackError) => {
										console.error(`Fallback ${fallbackType} failed:`, fallbackError);
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
				audioRef.current.addEventListener('ended', () => {
					console.log("Audio ended, cleaning up object URL");
					URL.revokeObjectURL(currentUrl);
				}, { once: true });
			} else {
				console.log("Received non-blob message:", lastMessage.data);
			}
		}
	}, [lastMessage]);

	// Cleanup audio element on unmount
	useEffect(() => {
		return () => {
			console.log("Cleaning up audio element on unmount");
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.src = '';
				console.log("Audio element cleaned up");
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

		console.log("Creating MediaRecorder with stream:", {
			streamId: webcamRef.current.stream.id,
			tracks: webcamRef.current.stream.getTracks().length,
			active: webcamRef.current.stream.active
		});

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
	};
}
