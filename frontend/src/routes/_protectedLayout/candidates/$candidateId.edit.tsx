import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useUpdateCandidate } from "@/api/mutations/candidates";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type CandidateFormData = {
	name: string;
	email: string;
	position: string;
	experience: number;
	status?:
		| "pending"
		| "reviewing"
		| "interviewing"
		| "accepted"
		| "rejected"
		| "on_hold";
	skills?: string;
};

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

	const form = useForm<CandidateFormData>({
		defaultValues: {
			name: c.name,
			email: c.email ?? "",
			position: c.position,
			experience: c.experience,
			status: c.status,
			skills: c.skills
				? Array.isArray(c.skills)
					? c.skills.join(", ")
					: c.skills
				: "",
		},
	});

	const onSubmit = (data: CandidateFormData) => {
		// Преобразуем строку навыков в массив
		const skillsArray = data.skills
			? data.skills
					.split(",")
					.map((skill) => skill.trim())
					.filter((skill) => skill.length > 0)
			: undefined;

		mutation.mutate(
			{
				name: data.name,
				email: data.email,
				position: data.position,
				experience: data.experience,
				status: data.status,
				skills: skillsArray,
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
					<Link
						to="/candidates/$candidateId"
						params={{ candidateId: params.candidateId }}
					>
						Отмена
					</Link>
				</Button>
			</div>

			{/* Edit form */}
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="max-w-2xl space-y-6"
				>
					<div className="rounded-lg border p-6">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Имя</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="position"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Должность</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="experience"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Опыт работы (лет)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												step={1}
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Статус</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Выберите статус" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="pending">В ожидании</SelectItem>
												<SelectItem value="reviewing">
													На рассмотрении
												</SelectItem>
												<SelectItem value="interviewing">
													Собеседование
												</SelectItem>
												<SelectItem value="accepted">Принят</SelectItem>
												<SelectItem value="rejected">Отклонен</SelectItem>
												<SelectItem value="on_hold">Приостановлен</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="skills"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Ключевые навыки</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Введите навыки через запятую (например: Python, React, SQL, Docker)"
											rows={3}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
							<Link
								to="/candidates/$candidateId"
								params={{ candidateId: params.candidateId }}
							>
								Отмена
							</Link>
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
