import { usePostInterviewMessageMutation } from "@/api/mutations/interviews";
import { candidateQueryOptions } from "@/api/queries/candidates";
import {
	interviewQueryOptions,
	interviewMessagesQueryOptions,
} from "@/api/queries/interviews";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "../ai-elements/conversation";
import { Message, MessageContent, MessageAvatar } from "../ai-elements/message";
import {
	PromptInput,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputSubmit,
} from "../ai-elements/prompt-input";
import { Badge } from "../ui/badge";
import { Response } from "../ai-elements/response";
import type Webcam from "react-webcam";

type Props = {
	interviewId: string;
	webcamRef: React.RefObject<Webcam | null>;
}

export function InterviewChat({ interviewId, webcamRef }: Props) {
	const [message, setMessage] = useState("");

	const interview = useSuspenseQuery(interviewQueryOptions(interviewId));
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

	const postMessageMutation = usePostInterviewMessageMutation();

	const handleSendMessage = async () => {
		if (!message.trim() || postMessageMutation.isPending) return;

		const messageText = message.trim();
		setMessage("");

		postMessageMutation.mutate(
			{
				interviewId,
				message: {
					text: messageText,
					type: "user",
				},
			},
			{
				onError: (error) => {
					toast.error("Ошибка при отправке сообщения");
					console.error("Failed to send message:", error);
					setMessage(messageText); // Restore message on error
				},
			},
		);
	};

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
								Собеседование
							</h1>
							<p className="text-gray-600">
								{candidate.data.name} •{" "}
								{vacancy?.data.title || "Общее собеседование"}
							</p>
						</div>
						<Badge variant="secondary" className="bg-green-100 text-green-800">
							Активно
						</Badge>
					</div>
				</div>
			</div>

			{/* Chat Container */}
			<div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
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
				<div className="">
					<PromptInput className="mt-4 relative">
						<PromptInputTextarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Введите ваше сообщение..."
							disabled={postMessageMutation.isPending}
						/>
						<PromptInputToolbar>
							<PromptInputSubmit
								onClick={handleSendMessage}
								disabled={!message.trim() || postMessageMutation.isPending}
								status={postMessageMutation.isPending ? "submitted" : undefined}
								className="absolute right-1 bottom-1"
							/>
						</PromptInputToolbar>
					</PromptInput>
				</div>
			</div>
		</div>
	);
}
