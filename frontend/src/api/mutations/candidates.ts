import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createCandidateCandidatesPost,
	deleteCandidateCandidatesCandidateIdDelete,
	updateCandidateCandidatesCandidateIdPatch,
	uploadCvCandidatesUploadCvPost,
} from "../client";
import type { CandidateCreate, CandidateRead } from "../client";

export type CandidateBody = CandidateCreate;

export const useCreateCandidate = () => {
	const qc = useQueryClient();
	return useMutation<CandidateRead, unknown, CandidateBody>({
		mutationFn: async (body: CandidateBody) => {
			const res = await createCandidateCandidatesPost<true>({
				body,
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
	});
};

export const useDeleteCandidate = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (candidate_id: string) => {
			await deleteCandidateCandidatesCandidateIdDelete<true>({
				path: { candidate_id },
				throwOnError: true,
			});
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
	});
};

export const useUpdateCandidate = (candidate_id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (body: CandidateBody) => {
			const res = await updateCandidateCandidatesCandidateIdPatch<true>({
				path: { candidate_id },
				body,
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["candidates"] });
			qc.invalidateQueries({ queryKey: ["candidate", candidate_id] });
		},
	});
};

export const useCreateFromCV = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (file: File) => {
			const res = await uploadCvCandidatesUploadCvPost<true>({
				body: { cv_file: file },
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
	});
};
