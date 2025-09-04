import { useMutation } from "@tanstack/react-query";
import { signinAuthSigninPost } from "../client";

export const useSignInMutation = () =>
	useMutation({
		mutationFn: async (body: { email: string; password: string }) => {
			const res = await signinAuthSigninPost<true>({ body, throwOnError: true });
			return res.data;
		},
	});

