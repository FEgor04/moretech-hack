import { queryOptions } from "@tanstack/react-query";
import { 
	listInterviewsInterviewsGet,
	getInterviewInterviewsInterviewIdGet,
	getInterviewMessagesInterviewsInterviewIdMessagesGet
} from "../client";

export const interviewsQueryOptions = () =>
	queryOptions({
		queryKey: ["interviews"],
		queryFn: async () => {
			const response = await listInterviewsInterviewsGet<true>({
				throwOnError: true,
			});
			return response.data;
		},
	});

export const interviewQueryOptions = (interviewId: string) =>
	queryOptions({
		queryKey: ["interviews", interviewId],
		queryFn: async () => {
			const response = await getInterviewInterviewsInterviewIdGet<true>({
				path: { interview_id: interviewId },
				throwOnError: true,
			});
			return response.data;
		},
	});

export const interviewsByCandidateQueryOptions = (candidateId: string) =>
	queryOptions({
		queryKey: ["interviews", "candidate", candidateId],
		queryFn: async () => {
			const response = await listInterviewsInterviewsGet<true>({
				throwOnError: true,
			});
			// Filter interviews by candidate ID on the frontend
			return response.data.filter(
				(interview) => interview.candidate_id === candidateId,
			);
		},
	});

export const interviewMessagesQueryOptions = (interviewId: string) =>
	queryOptions({
		queryKey: ["interviews", "messages", interviewId],
		queryFn: async () => {
			const response = await getInterviewMessagesInterviewsInterviewIdMessagesGet<true>({
				path: { interview_id: interviewId },
				throwOnError: true,
			});
			return response.data;
		},
	});

