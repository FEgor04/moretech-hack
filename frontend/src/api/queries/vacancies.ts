import { queryOptions, useQuery } from "@tanstack/react-query";
import { getVacancyVacanciesVacancyIdGet, listVacanciesVacanciesGet } from "../client";

export const vacanciesQueryOptions = () =>
	queryOptions({
		queryKey: ["vacancies"],
		queryFn: async () => {
			const res = await listVacanciesVacanciesGet<true>({ throwOnError: true });
			return res.data;
		},
	});

export const useVacanciesQuery = () => useQuery(vacanciesQueryOptions());

export const vacancyQueryOptions = (vacancyId: number) =>
	queryOptions({
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

export const useVacancyQuery = (vacancyId: number) => useQuery(vacancyQueryOptions(vacancyId));

