import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createInterviewInterviewsPost,
	postInterviewMessageInterviewsInterviewIdMessagesPost,
	initializeFirstMessageInterviewsInterviewIdMessagesFirstPost,
	createInterviewNoteInterviewsInterviewIdNotesPost,
	deleteInterviewNoteInterviewsInterviewIdNotesNoteIdDelete,
} from "../client";
import type {
	InterviewMessageRead,
	PostInterviewMessageInterviewsInterviewIdMessagesPostResponse,
	InitializeFirstMessageInterviewsInterviewIdMessagesFirstPostResponse,
} from "../client";

export interface CreateInterviewData {
	candidate_id: string;
	vacancy_id?: number;
	status?: string;
}

export interface PostInterviewMessageData {
	interviewId: string;
	message: {
		text: string;
		type: "system" | "user";
	};
}

export function useCreateInterviewMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateInterviewData) => {
			const response = await createInterviewInterviewsPost<true>({
				body: data,
				throwOnError: true,
			});
			return response.data;
		},
		onSuccess: () => {
			// Invalidate and refetch interviews queries
			queryClient.invalidateQueries({ queryKey: ["interviews"] });
			queryClient.invalidateQueries({ queryKey: ["candidates"] });
		},
	});
}

export function usePostInterviewMessageMutation() {
	const queryClient = useQueryClient();

	return useMutation<
		PostInterviewMessageInterviewsInterviewIdMessagesPostResponse,
		unknown,
		PostInterviewMessageData,
		{
			previousMessages: InterviewMessageRead[] | undefined;
			queryKey: ReadonlyArray<string | number>;
		}
	>({
		mutationFn: async (data: PostInterviewMessageData) => {
			const response =
				await postInterviewMessageInterviewsInterviewIdMessagesPost<true>({
					path: { interview_id: data.interviewId },
					body: data.message,
					throwOnError: true,
				});
			return response.data;
		},
		onMutate: async (variables: PostInterviewMessageData) => {
			const queryKey = [
				"interviews",
				"messages",
				variables.interviewId,
			] as const;

			await queryClient.cancelQueries({ queryKey });

			const previousMessages =
				queryClient.getQueryData<InterviewMessageRead[]>(queryKey);

			const lastIndex =
				previousMessages?.[previousMessages.length - 1]?.index ?? -1;
			const optimisticMessage: InterviewMessageRead = {
				interview_id: variables.interviewId,
				index: lastIndex + 1,
				text: variables.message.text,
				type: "user",
			};

			queryClient.setQueryData<InterviewMessageRead[]>(
				queryKey,
				(old: InterviewMessageRead[] | undefined) => {
					return [...(old ?? []), optimisticMessage];
				},
			);

			return { previousMessages, queryKey };
		},
		onError: (
			_error: unknown,
			_variables: PostInterviewMessageData,
			context?: {
				previousMessages: InterviewMessageRead[] | undefined;
				queryKey: ReadonlyArray<string | number>;
			},
		) => {
			if (context?.previousMessages && context?.queryKey) {
				queryClient.setQueryData(context.queryKey, context.previousMessages);
			}
		},
		onSettled: (
			_data:
				| PostInterviewMessageInterviewsInterviewIdMessagesPostResponse
				| undefined,
			_error: unknown,
			variables: PostInterviewMessageData,
		) => {
			// Always refetch to sync with server state
			queryClient.invalidateQueries({
				queryKey: ["interviews", "messages", variables.interviewId],
			});
		},
	});
}

export function useInitializeFirstMessageMutation() {
	const queryClient = useQueryClient();

	return useMutation<
		InitializeFirstMessageInterviewsInterviewIdMessagesFirstPostResponse,
		unknown,
		string
	>({
		mutationFn: async (interviewId: string) => {
			const response =
				await initializeFirstMessageInterviewsInterviewIdMessagesFirstPost<true>(
					{
						path: { interview_id: interviewId },
						throwOnError: true,
					},
				);
			return response.data;
		},
		onSuccess: (
			_data: InitializeFirstMessageInterviewsInterviewIdMessagesFirstPostResponse,
			interviewId: string,
		) => {
			// Invalidate and refetch interview messages for this specific interview
			queryClient.invalidateQueries({
				queryKey: ["interviews", "messages", interviewId],
			});
		},
	});
}

export const useCreateInterviewNote = (interviewId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (text: string) => {
			const res = await createInterviewNoteInterviewsInterviewIdNotesPost<true>(
				{
					path: { interview_id: interviewId },
					body: { interview_id: interviewId, text },
					throwOnError: true,
				},
			);
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["interview", interviewId, "notes"] });
		},
	});
};

export const useDeleteInterviewNote = (interviewId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (noteId: number) => {
			await deleteInterviewNoteInterviewsInterviewIdNotesNoteIdDelete<true>({
				path: { interview_id: interviewId, note_id: noteId },
				throwOnError: true,
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["interview", interviewId, "notes"] });
		},
	});
};
