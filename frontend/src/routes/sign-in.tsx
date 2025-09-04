import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { signinAuthSigninPost } from "../api/client";
import { setAccessToken } from "../lib/auth";

export const Route = createFileRoute("/sign-in")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const mutation = useMutation({
		mutationFn: async () => {
			const res = await signinAuthSigninPost({
				body: { email, password },
			});
			if ("error" in res && (res as unknown as { error?: unknown }).error) {
				throw new Error("Invalid credentials");
			}
			return (res as unknown as { data: { access_token: string } }).data;
		},
		onSuccess: (data: { access_token: string }) => {
			setAccessToken(data.access_token);
			navigate({ to: "/candidates" });
		},
		onError: (e: unknown) => {
			setError(e instanceof Error ? e.message : "Sign in failed");
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow">
				<h1 className="mb-4 text-xl font-semibold">Sign in</h1>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						mutation.mutate();
					}}
					className="space-y-3"
				>
					<div className="space-y-1">
						<label htmlFor="email" className="text-sm font-medium">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full rounded-md border px-3 py-2 text-sm"
							required
						/>
					</div>
					<div className="space-y-1">
						<label htmlFor="password" className="text-sm font-medium">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded-md border px-3 py-2 text-sm"
							required
						/>
					</div>
					{error ? <p className="text-sm text-red-600">{error}</p> : null}
					<button
						type="submit"
						disabled={mutation.isPending}
						className="mt-2 w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
					>
						{mutation.isPending ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
