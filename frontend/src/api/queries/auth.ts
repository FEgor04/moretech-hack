import { queryOptions } from "@tanstack/react-query";
import { meAuthMeGet } from "../client";

export const meQueryOptions = () =>
	queryOptions({
		queryKey: ["me"],
		queryFn: async () => {
			const res = await meAuthMeGet<true>({ throwOnError: true });
			return res.data;
		},
		retry: false,
	});
