import { createFileRoute } from "@tanstack/react-router";
import { useCandidateQuery } from "../api/queries/candidates";
import { useUpdateCandidate } from "../api/mutations/candidates";

export const Route = createFileRoute(
	"/_protectedLayout/candidates/$candidateId",
)({
	component: CandidateDetail,
});

function CandidateDetail() {
	const params = Route.useParams();
	const candidate = useCandidateQuery(params.candidateId);

	const mutation = useUpdateCandidate(params.candidateId);

	if (candidate.isLoading) return <div className="p-4">Loading...</div>;
	if (candidate.isError || !candidate.data)
		return <div className="p-4">Error loading</div>;

	const c = candidate.data;

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">{c.name}</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget as HTMLFormElement);
					mutation.mutate({
						name: String(fd.get("name") || c.name),
						email: String(fd.get("email") || c.email),
						status: String(fd.get("status") || c.status || "") || null,
						resume_url:
							String(fd.get("resume_url") || c.resume_url || "") || null,
						notes: String(fd.get("notes") || c.notes || "") || null,
					});
				}}
				className="grid max-w-xl grid-cols-2 gap-2 rounded-md border p-3"
			>
				<label htmlFor="name" className="col-span-2 text-sm font-medium">
					Name
				</label>
				<input id="name" name="name" defaultValue={c.name} className="rounded-md border px-2 py-1" />
				<label htmlFor="email" className="col-span-2 text-sm font-medium">
					Email
				</label>
				<input id="email" name="email" defaultValue={c.email} className="rounded-md border px-2 py-1" />
				<label htmlFor="status" className="col-span-2 text-sm font-medium">
					Status
				</label>
				<input id="status" name="status" defaultValue={c.status ?? ""} className="rounded-md border px-2 py-1" />
				<label htmlFor="resume_url" className="col-span-2 text-sm font-medium">
					Resume URL
				</label>
				<input id="resume_url" name="resume_url" defaultValue={c.resume_url ?? ""} className="rounded-md border px-2 py-1" />
				<label htmlFor="notes" className="col-span-2 text-sm font-medium">
					Notes
				</label>
				<textarea id="notes" name="notes" defaultValue={c.notes ?? ""} className="col-span-2 min-h-24 rounded-md border px-2 py-1" />
				<button
					type="submit"
					disabled={mutation.isPending}
					className="col-span-2 mt-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
				>
					{mutation.isPending ? "Saving..." : "Save"}
				</button>
			</form>
		</div>
	);
}
