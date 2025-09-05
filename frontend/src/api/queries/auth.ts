import { queryOptions } from "@tanstack/react-query";
import { meAuthMeGet } from "../client";
import { apiClient } from "../api-client";

export const meQueryOptions = () =>
	queryOptions({
		queryKey: ["me"],
		queryFn: async () => {
			const res = await meAuthMeGet<true>({ throwOnError: true, client: apiClient });
			return res.data;
		},
		retry: false,
	});
