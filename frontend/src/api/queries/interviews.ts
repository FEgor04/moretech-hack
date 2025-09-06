import { queryOptions } from "@tanstack/react-query";
import { listInterviewsInterviewsGet } from "../client";

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
