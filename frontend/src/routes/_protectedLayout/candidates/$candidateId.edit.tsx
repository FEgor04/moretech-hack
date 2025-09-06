import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useUpdateCandidate } from "@/api/mutations/candidates";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { CandidateStatus } from "@/api/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
	"/_protectedLayout/candidates/$candidateId/edit",
)({
	component: CandidateEdit,
	loader: async ({ params, context }) => {
		const candidate = await context.queryClient.fetchQuery(
			candidateQueryOptions(params.candidateId),
		);
		return { candidate };
	},
});

function CandidateEdit() {
	const params = Route.useParams();
	const candidate = useSuspenseQuery(candidateQueryOptions(params.candidateId));
	const navigate = Route.useNavigate();

	const mutation = useUpdateCandidate(params.candidateId);

	const c = candidate.data;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget as HTMLFormElement);
		const statusValue = String(fd.get("status") || c.status || "");
		mutation.mutate(
			{
				name: String(fd.get("name") || c.name),
				email: String(fd.get("email") || c.email),
				position: String(fd.get("position") || c.position),
				experience: Number(fd.get("experience") ?? c.experience),
				status: statusValue ? (statusValue as CandidateStatus) : undefined,
			},
			{
				onSuccess: () => {
					navigate({
						to: "/candidates/$candidateId",
						params: { candidateId: params.candidateId },
					});
				},
			},
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Редактировать кандидата</h1>
					<p className="text-muted-foreground">{c.name}</p>
				</div>
				<Button variant="outline" asChild>
					<Link to="/candidates/$candidateId" params={{ candidateId: params.candidateId }}>
						Отмена
					</Link>
				</Button>
			</div>

			{/* Edit form */}
			<form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
				<div className="rounded-lg border p-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<label htmlFor="name" className="text-sm font-medium">
								Имя
							</label>
							<input
								id="name"
								name="name"
								defaultValue={c.name}
								className="w-full rounded-md border px-3 py-2 text-sm"
								required
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium">
								Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								defaultValue={c.email}
								className="w-full rounded-md border px-3 py-2 text-sm"
								required
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="position" className="text-sm font-medium">
								Должность
							</label>
							<input
								id="position"
								name="position"
								defaultValue={c.position}
								className="w-full rounded-md border px-3 py-2 text-sm"
								required
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="experience" className="text-sm font-medium">
								Опыт работы (лет)
							</label>
							<input
								id="experience"
								name="experience"
								type="number"
								min={0}
								step={1}
								defaultValue={c.experience}
								className="w-full rounded-md border px-3 py-2 text-sm"
								required
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="status" className="text-sm font-medium">
								Статус
							</label>
							<select
								id="status"
								name="status"
								defaultValue={c.status ?? ""}
								className="w-full rounded-md border px-3 py-2 text-sm"
							>
								<option value="">Выберите статус</option>
								<option value="pending">В ожидании</option>
								<option value="reviewing">На рассмотрении</option>
								<option value="interviewing">Собеседование</option>
								<option value="accepted">Принят</option>
								<option value="rejected">Отклонен</option>
								<option value="on_hold">Приостановлен</option>
							</select>
						</div>
					</div>
				</div>

				{/* Form actions */}
				<div className="flex gap-3">
					<Button
						type="submit"
						disabled={mutation.isPending}
						className="min-w-24"
					>
						{mutation.isPending ? "Сохранение..." : "Сохранить"}
					</Button>
					<Button
						type="button"
						variant="outline"
						asChild
						disabled={mutation.isPending}
					>
						<Link to="/candidates/$candidateId" params={{ candidateId: params.candidateId }}>
							Отмена
						</Link>
					</Button>
				</div>
			</form>
		</div>
	);
}
