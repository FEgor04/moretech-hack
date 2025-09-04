import { useQuery } from "@tanstack/react-query";
import { meAuthMeGet } from "../client";

export const useMeQuery = () =>
	useQuery({
		queryKey: ["me"],
		queryFn: async () => {
			const res = await meAuthMeGet<true>({ throwOnError: true });
			return res.data;
		},
		retry: false,
	});

