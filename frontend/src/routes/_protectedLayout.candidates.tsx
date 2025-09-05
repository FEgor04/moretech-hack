import { createFileRoute } from "@tanstack/react-router";
import { candidatesQueryOptions } from "../api/queries/candidates";
import { useCreateCandidate } from "../api/mutations/candidates";
import type { CandidateRead } from "../api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCandidatesTable } from "../components/candidates/table";
import { DataTable } from "@/components/ui/data-table";

export const Route = createFileRoute("/_protectedLayout/candidates")({
	component: CandidatesPage,
});

function CandidatesPage() {
	const candidates = useSuspenseQuery(candidatesQueryOptions());

	return "Hi"
}
