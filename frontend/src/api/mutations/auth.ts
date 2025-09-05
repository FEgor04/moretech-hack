import { useMutation } from "@tanstack/react-query";
import { signinAuthSigninPost } from "../client";
import { apiClient } from "../api-client";

export const useSignInMutation = () =>
	useMutation({
		mutationFn: async (body: { email: string; password: string }) => {
			const res = await signinAuthSigninPost<true>({ body, client: apiClient });
			return res.data;
		},
	});
