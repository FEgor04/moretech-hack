import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createVacancyVacanciesPost,
	deleteVacancyVacanciesVacancyIdDelete,
	updateVacancyVacanciesVacancyIdPatch,
} from "../client";

export type VacancyBody = {
	title: string;
	description?: string | null;
	status?: string | null;
};

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
		},
	});
};
