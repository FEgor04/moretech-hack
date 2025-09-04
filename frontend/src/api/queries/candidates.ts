import { useQuery } from "@tanstack/react-query";
import { getCandidateCandidatesCandidateIdGet, listCandidatesCandidatesGet } from "../client";

export const useCandidatesQuery = () =>
	useQuery({
		queryKey: ["candidates"],
		queryFn: async () => {
			const res = await listCandidatesCandidatesGet<true>({ throwOnError: true });
			return res.data;
		},
	});

export const useCandidateQuery = (candidateId: string) =>
	useQuery({
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

