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
import { CheckIcon, Loader2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Input } from "../ui/input";
import { useState } from "react";
import { PromptInput, PromptInputTextarea } from "../ai-elements/prompt-input";

type Props = {
	interviewId: string;
};

export function InterviewChat({ interviewId }: Props) {
	const interview = useSuspenseQuery({
		...interviewQueryOptions(interviewId),
		refetchInterval: 1000,
	});
	const isFinished = interview.data.state === "done";
	const { webcamRef, sendAudioReadyMarker, socketState, sendTextMessage } = useWebcamStreaming(
		interviewId,
		{
			disabled: isFinished,
		},
	);
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

	const isAwaiting = socketState === "awaiting_user_answer";
	const isSTT = socketState === "speech_recognition";
	const isLLM = socketState === "generating_response";
	const isTTS = socketState === "speech_synthesis";

	const isDev = import.meta.env.DEV;
	const [debugPrompt, setDebugPrompt] = useState("");

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
			<div className="max-w-4xl mx-auto h-[calc(100vh-140px)] p-4">
				<div
					className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 data-[finished=true]:grid-cols-1"
					data-finished={isFinished}
				>
					{/* Left: Webcam */}
					{!isFinished && (
						<div className="flex flex-col">
							<WebcamComponent
								ref={webcamRef}
								audio={true}
								muted
								className="w-full rounded-md shadow aspect-video bg-black"
							/>
						</div>
					)}
					{/* Right: Chat */}
					<div className="flex flex-col min-h-0">
						<Conversation className="flex-1 min-h-0">
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
								{/* Typing indicator for LLM generation */}
								{!isFinished && isLLM && (
									<Message from="assistant">
										<MessageContent>
											<div className="flex items-center gap-2 text-muted-foreground">
												<span className="inline-flex items-center gap-1">
													<span className="size-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
													<span className="size-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
													<span className="size-2 rounded-full bg-current animate-bounce" />
												</span>
												<span>Печатает...</span>
											</div>
										</MessageContent>
										<MessageAvatar src="" name="AI" />
									</Message>
								)}
								{/* Recording indicator for TTS synthesis */}
								{!isFinished && isTTS && (
									<Message from="assistant">
										<MessageContent>
											<div className="flex items-center gap-2 text-muted-foreground">
												<Loader2Icon className="size-4 animate-spin" />
												<span>Recording audio...</span>
											</div>
										</MessageContent>
										<MessageAvatar src="" name="AI" />
									</Message>
								)}
							</ConversationContent>
							<ConversationScrollButton />
						</Conversation>
						{/* Message Input */}
						{!isFinished && (
							<div className="flex justify-center py-4 w-full">
								{isDev ? (
									<div className="flex w-full max-w-xl items-center gap-2">
										<PromptInputTextarea
											placeholder="Debug prompt..."
											value={debugPrompt}
											onChange={(e) => setDebugPrompt(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && debugPrompt.trim().length > 0) {
													sendTextMessage(debugPrompt.trim());
													setDebugPrompt("");
												}
											}}
										/>
										<Button
											onClick={() => {
												if (debugPrompt.trim().length === 0) return;
												sendTextMessage(debugPrompt.trim());
												setDebugPrompt("");
											}}
										>
											Отправить
										</Button>
									</div>
								) : isAwaiting ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												onClick={sendAudioReadyMarker}
												className="relative rounded-full size-14 p-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg animate-pulse"
											>
												<span className="absolute inset-0 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-pink-500 animate-spin opacity-20" />
												<span className="relative z-10 flex items-center justify-center rounded-full size-12 bg-background text-foreground">
													<CheckIcon />
												</span>
											</Button>
										</TooltipTrigger>
										<TooltipContent>Ответ готов</TooltipContent>
									</Tooltip>
								) : isSTT ? (
									<div className="flex items-center justify-center rounded-full size-12 bg-secondary text-secondary-foreground">
										<Loader2Icon className="size-6 animate-spin" />
									</div>
								) : null}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
