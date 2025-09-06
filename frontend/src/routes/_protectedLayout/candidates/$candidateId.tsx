import { createFileRoute } from "@tanstack/react-router";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useUpdateCandidate } from "@/api/mutations/candidates";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { CandidateStatus } from "@/api/client";

export const Route = createFileRoute(
	"/_protectedLayout/candidates/$candidateId",
)({
	component: CandidateDetail,
});

function CandidateDetail() {
	const params = Route.useParams();
	const candidate = useSuspenseQuery(candidateQueryOptions(params.candidateId));

	const mutation = useUpdateCandidate(params.candidateId);

	const c = candidate.data;

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">{c.name}</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget as HTMLFormElement);
					const statusValue = String(fd.get("status") || c.status || "");
					mutation.mutate({
						name: String(fd.get("name") || c.name),
						email: String(fd.get("email") || c.email),
						position: String(fd.get("position") || c.position),
						experience: Number(fd.get("experience") ?? c.experience),
						status: statusValue ? (statusValue as CandidateStatus) : undefined,
					});
				}}
				className="grid max-w-xl grid-cols-2 gap-2 rounded-md border p-3"
			>
				<label htmlFor="name" className="col-span-2 text-sm font-medium">
					Name
				</label>
				<input
					id="name"
					name="name"
					defaultValue={c.name}
					className="rounded-md border px-2 py-1"
				/>
				<label htmlFor="email" className="col-span-2 text-sm font-medium">
					Email
				</label>
				<input
					id="email"
					name="email"
					defaultValue={c.email}
					className="rounded-md border px-2 py-1"
				/>
				<label htmlFor="position" className="col-span-2 text-sm font-medium">
					Position
				</label>
				<input
					id="position"
					name="position"
					defaultValue={c.position}
					className="rounded-md border px-2 py-1"
				/>
				<label htmlFor="experience" className="col-span-2 text-sm font-medium">
					Experience (years)
				</label>
				<input
					id="experience"
					name="experience"
					type="number"
					min={0}
					step={1}
					defaultValue={c.experience}
					className="rounded-md border px-2 py-1"
				/>
				<label htmlFor="status" className="col-span-2 text-sm font-medium">
					Status
				</label>
				<input
					id="status"
					name="status"
					defaultValue={c.status ?? ""}
					className="rounded-md border px-2 py-1"
				/>

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
