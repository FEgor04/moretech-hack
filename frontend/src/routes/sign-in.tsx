import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSignInMutation } from "@/api/mutations/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sign-in")({
	component: RouteComponent,
});

// TODO: refactor with react hook form
function RouteComponent() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("admin@example.com");
	const [password, setPassword] = useState("admin");

	const {mutate, isPending, error} = useSignInMutation();

	function handleSubmit({ email, password }: { email: string; password: string }) {
		mutate({ email, password }, { onSuccess: () => {
			navigate({ to: "/candidates" });
		}});
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow">
				<h1 className="mb-4 text-xl font-semibold">Sign in</h1>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit({ email, password });
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
					{error ? <p className="text-sm text-red-600">{error.message}</p> : null}
					<Button
						type="submit"
						disabled={isPending}
					>
						{isPending ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</div>
		</div>
	);
}
