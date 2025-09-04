// Deprecated misspelled route file kept temporarily to avoid import errors.
// Redirect to the correct vacancies route.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protectedLayout/vaccancies")({
	beforeLoad: () => {
		throw redirect({ to: "/vacancies" });
	},
});
