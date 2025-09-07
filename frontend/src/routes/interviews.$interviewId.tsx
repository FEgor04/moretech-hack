import { interviewMessagesQueryOptions } from "@/api/queries/interviews";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { InterviewChat } from "@/components/interviews/interview-chat";
import { StartInterview } from "@/components/interviews/start-interview";

export const Route = createFileRoute("/interviews/$interviewId")({
	component: RouteComponent,
});

function RouteComponent() {
	const params = Route.useParams();
	const messages = useSuspenseQuery(
		interviewMessagesQueryOptions(params.interviewId),
	);
	if (messages.data.length === 0) {
		return <StartInterview interviewId={params.interviewId} />;
	}

	return <InterviewChat interviewId={params.interviewId} />;
}
