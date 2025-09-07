import { queryOptions } from "@tanstack/react-query";
import {
	getVacancyVacanciesVacancyIdGet,
	listVacanciesVacanciesGet,
} from "../client";
import type {
	GetVacancyVacanciesVacancyIdGetResponse,
	ListVacanciesVacanciesGetResponse,
} from "../client";
import { apiClient } from "../api-client";

export const vacanciesQueryOptions = () =>
	queryOptions({
		queryKey: ["vacancies"],
		queryFn: async () => {
			const res = await listVacanciesVacanciesGet<true>({ throwOnError: true });
			return res.data as ListVacanciesVacanciesGetResponse;
		},
	});

export const vacancyQueryOptions = (vacancyId: number) =>
	queryOptions({
		queryKey: ["vacancy", vacancyId],
		queryFn: async () => {
			const res = await getVacancyVacanciesVacancyIdGet<true>({
				path: { vacancy_id: vacancyId },
				throwOnError: true,
			});
			return res.data as GetVacancyVacanciesVacancyIdGetResponse;
		},
	});

export type NoteDTO = {
	id: number;
	vacancy_id: number;
	text: string;
	created_at?: string | null;
};

export const vacancyNotesPageQueryOptions = (
	vacancyId: number,
	limit: number,
	offset: number,
) =>
	queryOptions({
		queryKey: ["vacancy", vacancyId, "notes", { limit, offset }],
		queryFn: async () => {
			const res = await apiClient.get({
				url: "/vacancies/{vacancy_id}/notes",
				path: { vacancy_id: vacancyId },
				query: { limit, offset },
				throwOnError: true,
			});
			return res.data as Array<NoteDTO>;
		},
	});
