import { candidateQueryOptions } from "@/api/queries/candidates";
import {
	interviewQueryOptions,
	interviewMessagesQueryOptions,
} from "@/api/queries/interviews";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "../ai-elements/conversation";
import { Message, MessageContent, MessageAvatar } from "../ai-elements/message";
import { Response } from "../ai-elements/response";
import WebcamComponent from "react-webcam";
import { Button } from "../ui/button";
import { useWebcamStreaming } from "@/hooks/use-webcam-streaming";
import { InterviewStatusBadge } from "../candidates/interview-status-badge";
import type { InterviewState } from "@/api/client";

type Props = {
	interviewId: string;
};

export function InterviewChat({ interviewId }: Props) {
	const interview = useSuspenseQuery(interviewQueryOptions(interviewId));
	const isFinished = interview.data.state === ("done" as InterviewState);
	const { webcamRef, sendAudioReadyMarker } = useWebcamStreaming(interviewId, {
		disabled: isFinished,
	});
	const candidate = useSuspenseQuery(
		candidateQueryOptions(interview.data.candidate_id),
	);
	const vacancy = interview.data.vacancy_id
		? useSuspenseQuery(vacancyQueryOptions(interview.data.vacancy_id))
		: null;

	// Poll messages every 1000ms
	const messages = useQuery({
		...interviewMessagesQueryOptions(interviewId),
		refetchInterval: 1000,
	});

	if (messages.isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
					<p className="text-gray-600">Загрузка собеседования...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Собеседование{isFinished ? " (Завершено)" : ""}
							</h1>
							<p className="text-gray-600">
								{candidate.data.name} •{" "}
								{vacancy?.data.title || "Общее собеседование"}
							</p>
						</div>
						<InterviewStatusBadge
							state={interview.data.state as InterviewState}
						/>
					</div>
				</div>
			</div>

			{/* Chat Container */}
			<div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
				{/* Webcam */}
				{!isFinished && (
					<div className="w-full p-4">
						<WebcamComponent
							ref={webcamRef}
							audio={true}
							muted
							className="w-full rounded-md shadow aspect-video bg-black"
						/>
					</div>
				)}
				{/* Messages */}
				<Conversation className="flex-1">
					<ConversationContent>
						{messages.data?.map((msg) => (
							<Message
								key={`${msg.interview_id}-${msg.index}`}
								from={msg.type as "user" | "assistant"}
							>
								<MessageContent>
									<Response>{msg.text}</Response>
								</MessageContent>
								<MessageAvatar
									src={msg.type === "user" ? "" : ""}
									name={msg.type === "user" ? candidate.data.name : "AI"}
								/>
							</Message>
						))}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				{/* Message Input */}
				{!isFinished && (
					<div className="">
						<Button onClick={sendAudioReadyMarker}>Ответ готов</Button>
					</div>
				)}
			</div>
		</div>
	);
}
