import { useRef, useState } from "react";
import type Webcam from "react-webcam";
import useWebSocket, { ReadyState } from "react-use-websocket";

export function useWebcamStreaming(interviewId: string) {
	const webcamRef = useRef<Webcam | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const { sendMessage, readyState } = useWebSocket(`/ws/${interviewId}/video`, {
		onError: (error) => {
			console.error("Error connecting to webcam stream", error);
		},
		onOpen: () => {
			console.log("Connected to webcam stream");
			startRecording();
		},
	});

	// TODO: check if webcam is also ready.
	const isReady = readyState === ReadyState.OPEN;

	function handleDataAvailable(data: BlobEvent) {
		sendMessage(data.data);
	}

	/**
	 * Функция, которую нужно вызывать, когда собеседуемый ответил на вопрос.
	 * В текущей реализации она вызывается когда собеседуемый нажал кнопку "Ответ готов" в чате.
	 *
	 * В будущем ее нужно будет убрать и использовать voice activity detection
	 * https://huggingface.co/models?pipeline_tag=voice-activity-detection
	 */
	function sendAudioReadyMarker() {
		sendMessage("audio-ready");
	}

	function startRecording() {
		setIsRecording(true);
		if (!webcamRef.current || !webcamRef.current.stream) {
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
		console.log("Recording started");
	}

	function handleStopRecording() {
		setIsRecording(false);
		mediaRecorderRef.current?.stop();
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
