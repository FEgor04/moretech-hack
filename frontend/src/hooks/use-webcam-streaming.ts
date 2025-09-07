import { useRef, useState } from "react";
import type Webcam from "react-webcam";

export function useWebcamStreaming() {
	const webcamRef = useRef<Webcam | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    function handleDataAvailable(data: BlobEvent) {
        console.log("Data available", data);
    }

    function startRecording() {
        setIsRecording(true);
        if(!webcamRef.current) {
            return;
        }

        mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream!, {
            mimeType: "video/webm",
        });
        mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
        mediaRecorderRef.current.start();
    }

    function handleStopRecording() {
        setIsRecording(false);
        mediaRecorderRef.current?.stop();
    }   

	return {
		webcamRef,
        isRecording,
        startRecording,
        handleStopRecording,
	};
}