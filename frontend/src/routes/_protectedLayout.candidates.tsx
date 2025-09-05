import { createFileRoute } from "@tanstack/react-router";
import { candidatesQueryOptions } from "../api/queries/candidates";
import { useCreateCandidate } from "../api/mutations/candidates";
import { flexRender } from "@tanstack/react-table";
import type { CandidateRead } from "../api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCandidatesTable } from "../components/candidates/table";
import { DataTable } from "@/components/ui/data-table";

export const Route = createFileRoute("/_protectedLayout/candidates")({
	component: CandidatesPage,
});

function CandidatesPage() {
	const candidates = useSuspenseQuery(candidatesQueryOptions());

	const createMutation = useCreateCandidate();

	const table = useCandidatesTable((candidates.data ?? []) as CandidateRead[]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Candidates</h1>
			</div>
			<DataTable table={table} />
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget as HTMLFormElement);
					createMutation.mutate({
						name: String(fd.get("name") || ""),
						email: String(fd.get("email") || ""),
						status: String(fd.get("status") || "") || null,
						resume_url: String(fd.get("resume_url") || "") || null,
						notes: String(fd.get("notes") || "") || null,
					});
				}}
				className="rounded-md border p-3"
			>
				<h2 className="mb-2 font-medium">Quick add</h2>
				<div className="grid grid-cols-2 gap-2">
					<input
						name="name"
						placeholder="Name"
						className="rounded-md border px-2 py-1"
					/>
					<input
						name="email"
						placeholder="Email"
						className="rounded-md border px-2 py-1"
					/>
					<input
						name="status"
						placeholder="Status"
						className="rounded-md border px-2 py-1"
					/>
					<input
						name="resume_url"
						placeholder="Resume URL"
						className="rounded-md border px-2 py-1"
					/>
					<input
						name="notes"
						placeholder="Notes"
						className="col-span-2 rounded-md border px-2 py-1"
					/>
				</div>
				<button
					type="submit"
					disabled={createMutation.isPending}
					className="mt-3 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
				>
					{createMutation.isPending ? "Creating..." : "Create"}
				</button>
			</form>
		</div>
	);
}
