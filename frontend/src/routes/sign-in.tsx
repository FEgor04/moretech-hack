import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useSignInMutation } from "@/api/mutations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { setAccessToken } from "@/lib/auth";

export const Route = createFileRoute("/sign-in")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const form = useForm<{ email: string; password: string }>({
		defaultValues: { email: "admin@example.com", password: "admin" },
	});

	const { mutate, isPending, error } = useSignInMutation();

	function onSubmit(values: { email: string; password: string }) {
		mutate(
			{ email: values.email, password: values.password },
			{
				onSuccess: (data) => {
					setAccessToken(data.access_token);
					navigate({ to: "/candidates" });
				},
			},
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow">
				<h1 className="mb-4 text-xl font-semibold">Sign in</h1>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
						<FormField
							control={form.control}
							name="email"
							rules={{ required: "Email is required" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="you@example.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							rules={{ required: "Password is required" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input type="password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{error ? (
							<p className="text-destructive text-sm">
								{error instanceof Error ? error.message : "Sign in failed"}
							</p>
						) : null}
						<Button type="submit" disabled={isPending}>
							{isPending ? "Signing in..." : "Sign in"}
						</Button>
					</form>
				</Form>
			</div>
		</div>
	);
}
