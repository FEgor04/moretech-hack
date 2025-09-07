import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { useUpdateVacancy } from "@/api/mutations/vacancies";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
	const navigate = useNavigate();
	const vacancy = useSuspenseQuery(
		vacancyQueryOptions(Number(params.vacancyId)),
	);

	const mutation = useUpdateVacancy(Number(params.vacancyId));

	const v = vacancy.data;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget as HTMLFormElement);
		const statusValue = String(fd.get("status") || v.status || "");
		
		mutation.mutate({
			title: String(fd.get("title") || v.title),
			description: String(fd.get("description") || v.description || ""),
			status: statusValue || null,
		}, {
			onSuccess: () => {
				toast.success("Вакансия обновлена");
				navigate({ to: "/vacancies" });
			},
			onError: () => {
				toast.error("Ошибка при обновлении вакансии");
			},
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">{v.title}</h1>
				<button
					type="button"
					onClick={() => navigate({ to: "/vacancies" })}
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Назад к списку
				</button>
			</div>
			
			<form
				onSubmit={handleSubmit}
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
					<option value="open">Открыта</option>
					<option value="closed">Закрыта</option>
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
