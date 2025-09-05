import { queryOptions } from "@tanstack/react-query";
import {
	getCandidateCandidatesCandidateIdGet,
	listCandidatesCandidatesGet,
} from "../client";

export const candidatesQueryOptions = () =>
	queryOptions({
		queryKey: ["candidates"],
		queryFn: async () => {
			const res = await listCandidatesCandidatesGet<true>({
				throwOnError: true,
			});
			return res.data;
		},
	});

export const candidateQueryOptions = (candidateId: string) =>
	queryOptions({
		queryKey: ["candidate", candidateId],
		queryFn: async () => {
			const res = await getCandidateCandidatesCandidateIdGet<true>({
				path: { candidate_id: candidateId },
				throwOnError: true,
			});
			return res.data;
		},
		enabled: Boolean(candidateId),
	});
