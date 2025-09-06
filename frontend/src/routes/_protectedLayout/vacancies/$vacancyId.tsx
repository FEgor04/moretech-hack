import { createFileRoute } from "@tanstack/react-router";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { useUpdateVacancy } from "@/api/mutations/vacancies";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_protectedLayout/vacancies/$vacancyId")({
	component: VacancyDetail,
	loader: async ({ params, context }) => {
		const vacancy = await context.queryClient.fetchQuery(
			vacancyQueryOptions(Number(params.vacancyId)),
		);
		return { vacancy };
	},
});

function VacancyDetail() {
	const params = Route.useParams();
	const vacancy = useSuspenseQuery(
		vacancyQueryOptions(Number(params.vacancyId)),
	);

	const mutation = useUpdateVacancy(Number(params.vacancyId));

	const v = vacancy.data;

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">{v.title}</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget as HTMLFormElement);
					const statusValue = String(fd.get("status") || v.status || "");
					mutation.mutate({
						title: String(fd.get("title") || v.title),
						description: String(fd.get("description") || v.description || ""),
						status: statusValue || null,
					});
				}}
				className="grid max-w-xl grid-cols-2 gap-2 rounded-md border p-3"
			>
				<label htmlFor="title" className="col-span-2 text-sm font-medium">
					Название
				</label>
				<input
					id="title"
					name="title"
					defaultValue={v.title}
					className="col-span-2 rounded-md border px-2 py-1"
				/>
				<label htmlFor="description" className="col-span-2 text-sm font-medium">
					Описание
				</label>
				<textarea
					id="description"
					name="description"
					defaultValue={v.description || ""}
					rows={4}
					className="col-span-2 rounded-md border px-2 py-1"
				/>
				<label htmlFor="status" className="col-span-2 text-sm font-medium">
					Статус
				</label>
				<select
					id="status"
					name="status"
					defaultValue={v.status ?? ""}
					className="col-span-2 rounded-md border px-2 py-1"
				>
					<option value="">Не выбран</option>
					<option value="draft">Черновик</option>
					<option value="published">Опубликована</option>
					<option value="closed">Закрыта</option>
					<option value="archived">Архив</option>
				</select>

				<button
					type="submit"
					disabled={mutation.isPending}
					className="col-span-2 mt-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
				>
					{mutation.isPending ? "Сохранение..." : "Сохранить"}
				</button>
			</form>
		</div>
	);
}
