import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
	createInterviewInterviewsPost,
	postInterviewMessageInterviewsInterviewIdMessagesPost,
	initializeFirstMessageInterviewsInterviewIdMessagesFirstPost
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

	return useMutation({
		mutationFn: async (data: PostInterviewMessageData) => {
			const response = await postInterviewMessageInterviewsInterviewIdMessagesPost<true>({
				path: { interview_id: data.interviewId },
				body: data.message,
				throwOnError: true,
			});
			return response.data;
		},
		onSuccess: (_, variables) => {
			// Invalidate and refetch interview messages for this specific interview
			queryClient.invalidateQueries({ 
				queryKey: ["interviews", "messages", variables.interviewId] 
			});
		},
	});
}

export function useInitializeFirstMessageMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (interviewId: string) => {
			const response = await initializeFirstMessageInterviewsInterviewIdMessagesFirstPost<true>({
				path: { interview_id: interviewId },
				throwOnError: true,
			});
			return response.data;
		},
		onSuccess: (_, interviewId) => {
			// Invalidate and refetch interview messages for this specific interview
			queryClient.invalidateQueries({ 
				queryKey: ["interviews", "messages", interviewId] 
			});
		},
	});
}
