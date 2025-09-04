import { createFileRoute } from "@tanstack/react-router";
import { useVacancyQuery } from "../api/queries/vacancies";
import { useUpdateVacancy } from "../api/mutations/vacancies";

export const Route = createFileRoute(
	"/_protectedLayout/vacancies/$vacancyId",
)({
	component: VacancyDetail,
});

function VacancyDetail() {
	const params = Route.useParams();
	const vacancyId = Number(params.vacancyId);
	const vacancy = useVacancyQuery(vacancyId);

	const mutation = useUpdateVacancy(vacancyId);

	if (vacancy.isLoading) return <div className="p-4">Loading...</div>;
	if (vacancy.isError || !vacancy.data) return <div className="p-4">Error loading</div>;

	const v = vacancy.data;

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">{v.title}</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget as HTMLFormElement);
					mutation.mutate({
						title: String(fd.get("title") || v.title),
						status: String(fd.get("status") || v.status || "") || null,
						description:
							String(fd.get("description") || v.description || "") || null,
					});
				}}
				className="grid max-w-xl grid-cols-2 gap-2 rounded-md border p-3"
			>
				<label htmlFor="title" className="col-span-2 text-sm font-medium">
					Title
				</label>
				<input id="title" name="title" defaultValue={v.title} className="rounded-md border px-2 py-1" />
				<label htmlFor="status" className="col-span-2 text-sm font-medium">
					Status
				</label>
				<input id="status" name="status" defaultValue={v.status ?? ""} className="rounded-md border px-2 py-1" />
				<label htmlFor="description" className="col-span-2 text-sm font-medium">
					Description
				</label>
				<textarea id="description" name="description" defaultValue={v.description ?? ""} className="col-span-2 min-h-24 rounded-md border px-2 py-1" />
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
