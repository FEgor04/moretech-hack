import { queryOptions } from "@tanstack/react-query";
import {
	getVacancyVacanciesVacancyIdGet,
	listVacanciesVacanciesGet,
	listVacancyNotesVacanciesVacancyIdNotesGet,
} from "../client";
import type {
	GetVacancyVacanciesVacancyIdGetResponse,
	ListVacanciesVacanciesGetResponse,
} from "../client";

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

export const vacancyNotesQueryOptions = (vacancyId: number) =>
	queryOptions({
		queryKey: ["vacancy", vacancyId, "notes"],
		queryFn: async () => {
			const res = await listVacancyNotesVacanciesVacancyIdNotesGet<true>({
				path: { vacancy_id: vacancyId },
				throwOnError: true,
			});
			return res.data;
		},
	});
