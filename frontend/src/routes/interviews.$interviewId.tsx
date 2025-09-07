import { interviewMessagesQueryOptions } from "@/api/queries/interviews";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { InterviewChat } from "@/components/interviews/interview-chat";
import { StartInterview } from "@/components/interviews/start-interview";
import { useWebcamStreaming } from "@/hooks/use-webcam-streaming";

export const Route = createFileRoute("/interviews/$interviewId")({
	component: RouteComponent,
});

function RouteComponent() {
	const params = Route.useParams();
	const messages = useSuspenseQuery(
		interviewMessagesQueryOptions(params.interviewId),
	);
	const { webcamRef, startRecording, sendAudioReadyMarker } = useWebcamStreaming(params.interviewId);

	if (messages.data.length === 0) {
		return (
			<StartInterview webcamRef={webcamRef} interviewId={params.interviewId} />
		);
	}

	return (
		<InterviewChat webcamRef={webcamRef} interviewId={params.interviewId} startRecording={startRecording} sendAudioReadyMarker={sendAudioReadyMarker} />
	);
}
