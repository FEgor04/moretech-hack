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
	status?:
		| "pending"
		| "reviewing"
		| "interviewing"
		| "accepted"
		| "rejected"
		| "on_hold";
	skills?: string;
	tech?: string;
	education?: string;
	geo?: string;
	employment_type?: string;
	experience?: string;
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
			status: c.status,
			skills: c.skills
				? Array.isArray(c.skills)
					? c.skills.join(", ")
					: c.skills
				: "",
			tech: c.tech ? (Array.isArray(c.tech) ? c.tech.join(", ") : c.tech) : "",
			education: c.education
				? typeof c.education === "string"
					? c.education
					: JSON.stringify(c.education, null, 2)
				: "",
			geo: c.geo ?? "",
			employment_type: c.employment_type ?? undefined,
			experience: c.experience
				? typeof c.experience === "string"
					? c.experience
					: JSON.stringify(c.experience, null, 2)
				: "",
		},
	});

	const onSubmit = (data: CandidateFormData) => {
		// Преобразуем строки навыков и технологий в массивы
		const skillsArray = data.skills
			? data.skills
					.split(",")
					.map((skill) => skill.trim())
					.filter((skill) => skill.length > 0)
			: undefined;

		const techArray = data.tech
			? data.tech
					.split(",")
					.map((tech) => tech.trim())
					.filter((tech) => tech.length > 0)
			: undefined;

		mutation.mutate(
			{
				name: data.name,
				email: data.email,
				position: data.position,
				status: data.status,
				skills: skillsArray || [],
				tech: techArray || [],
				education: data.education ? JSON.parse(data.education) : [],
				geo: data.geo || undefined,
				employment_type: data.employment_type as
					| "полная занятость"
					| "частичная занятость"
					| "контракт"
					| "стажировка"
					| undefined,
				experience: data.experience ? JSON.parse(data.experience) : [],
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
						<FormField
							control={form.control}
							name="tech"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Технологии</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Введите технологии через запятую (например: JavaScript, TypeScript, Node.js, PostgreSQL)"
											rows={3}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="geo"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Местоположение</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Москва, Россия" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="employment_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Тип занятости</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Выберите тип занятости" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="полная занятость">
												Полная занятость
											</SelectItem>
											<SelectItem value="частичная занятость">
												Частичная занятость
											</SelectItem>
											<SelectItem value="контракт">Контракт</SelectItem>
											<SelectItem value="стажировка">Стажировка</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="education"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Образование</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Введите информацию об образовании (JSON формат или текст)"
											rows={4}
										/>
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
									<FormLabel>Детальный опыт работы</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Введите детальную информацию об опыте работы (JSON формат или текст)"
											rows={6}
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
