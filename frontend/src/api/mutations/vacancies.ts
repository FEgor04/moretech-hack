import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createVacancyVacanciesPost,
	deleteVacancyVacanciesVacancyIdDelete,
	updateVacancyVacanciesVacancyIdPatch,
	uploadVacancyPdfVacanciesUploadPdfPost,
	createVacancyNoteVacanciesVacancyIdNotesPost,
	updateVacancyNoteVacanciesVacancyIdNotesNoteIdPatch,
	deleteVacancyNoteVacanciesVacancyIdNotesNoteIdDelete,
} from "../client";
import type { VacancyCreate } from "../client";

// Use the generated VacancyCreate type which includes all supported fields
export type VacancyBody = VacancyCreate;

export const useCreateVacancy = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (body: VacancyBody) => {
			const res = await createVacancyVacanciesPost<true>({
				body,
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["vacancies"] }),
	});
};

export const useDeleteVacancy = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (vacancy_id: number) => {
			await deleteVacancyVacanciesVacancyIdDelete<true>({
				path: { vacancy_id },
				throwOnError: true,
			});
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["vacancies"] }),
	});
};

export const useUpdateVacancy = (vacancy_id: number) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (body: VacancyBody) => {
			const res = await updateVacancyVacanciesVacancyIdPatch<true>({
				path: { vacancy_id },
				body,
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vacancies"] });
			qc.invalidateQueries({ queryKey: ["vacancy", vacancy_id] });
			qc.invalidateQueries({ queryKey: ["vacancy", vacancy_id, "notes"] });
		},
	});
};

export const useCreateFromPDF = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (file: File) => {
			const res = await uploadVacancyPdfVacanciesUploadPdfPost<true>({
				body: { pdf_file: file },
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["vacancies"] }),
	});
};

export const useCreateVacancyNote = (vacancy_id: number) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (text: string) => {
			const res = await createVacancyNoteVacanciesVacancyIdNotesPost<true>({
				path: { vacancy_id },
				body: { vacancy_id, text },
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vacancy", vacancy_id, "notes"] });
		},
	});
};

export const useUpdateVacancyNote = (vacancy_id: number) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (params: { noteId: number; text: string }) => {
			const res =
				await updateVacancyNoteVacanciesVacancyIdNotesNoteIdPatch<true>({
					path: { vacancy_id, note_id: params.noteId },
					body: { text: params.text },
					throwOnError: true,
				});
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vacancy", vacancy_id, "notes"] });
		},
	});
};

export const useDeleteVacancyNote = (vacancy_id: number) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (noteId: number) => {
			await deleteVacancyNoteVacanciesVacancyIdNotesNoteIdDelete<true>({
				path: { vacancy_id, note_id: noteId },
				throwOnError: true,
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vacancy", vacancy_id, "notes"] });
		},
	});
};
