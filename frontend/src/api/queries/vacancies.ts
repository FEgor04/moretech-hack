import { useQuery } from "@tanstack/react-query";
import { getVacancyVacanciesVacancyIdGet, listVacanciesVacanciesGet } from "../client";

export const useVacanciesQuery = () =>
	useQuery({
		queryKey: ["vacancies"],
		queryFn: async () => {
			const res = await listVacanciesVacanciesGet<true>({ throwOnError: true });
			return res.data;
		},
	});

export const useVacancyQuery = (vacancyId: number) =>
	useQuery({
		queryKey: ["vacancy", vacancyId],
		queryFn: async () => {
			const res = await getVacancyVacanciesVacancyIdGet<true>({
				path: { vacancy_id: vacancyId },
				throwOnError: true,
			});
			return res.data;
		},
		enabled: Number.isFinite(vacancyId),
	});

