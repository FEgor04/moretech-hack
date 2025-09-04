import { createFileRoute } from "@tanstack/react-router";
import {
	getVacancyVacanciesVacancyIdGet,
	updateVacancyVacanciesVacancyIdPatch,
} from "../api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute(
	"/_protectedLayout/vacancies/$vacancyId",
)({
	component: VacancyDetail,
});

function VacancyDetail() {
	const params = Route.useParams();
	const vacancyId = Number(params.vacancyId);
	const queryClient = useQueryClient();
	const vacancy = useQuery({
		queryKey: ["vacancy", vacancyId],
		queryFn: async () => {
			const res = await getVacancyVacanciesVacancyIdGet<true>({
				path: { vacancy_id: vacancyId },
				throwOnError: true,
			});
			return res.data;
		},
	});

	type VacancyUpdateBody = {
		title: string;
		status?: string | null;
		description?: string | null;
	};

	const mutation = useMutation({
		mutationFn: async (body: VacancyUpdateBody) => {
			const res = await updateVacancyVacanciesVacancyIdPatch<true>({
				path: { vacancy_id: vacancyId },
				body,
				throwOnError: true,
			});
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vacancy", vacancyId] });
		},
	});

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
