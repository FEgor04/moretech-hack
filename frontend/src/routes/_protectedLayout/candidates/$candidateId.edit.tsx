import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useUpdateCandidate } from "@/api/mutations/candidates";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/ui/tags-input";
import { EducationForm } from "@/components/ui/education-form";
import { ExperienceForm } from "@/components/ui/experience-form";

// Схема валидации
const formSchema = z.object({
	name: z.string().min(1, "Имя обязательно"),
	email: z.string().email("Неверный формат email"),
	position: z.string().min(1, "Должность обязательна"),
	status: z
		.enum([
			"pending",
			"reviewing",
			"interviewing",
			"accepted",
			"rejected",
			"on_hold",
		])
		.optional(),
	skills: z.array(z.string()).optional(),
	tech: z.array(z.string()).optional(),
	education: z
		.array(
			z.object({
				organization: z.string(),
				speciality: z.string(),
				year: z.number().nullable().optional(),
				type: z.string().nullable().optional(),
				start_date: z.string().nullable().optional(),
				end_date: z.string().nullable().optional(),
			}),
		)
		.optional(),
	geo: z.string().optional(),
	employment_type: z
		.enum(["полная занятость", "частичная занятость", "контракт", "стажировка"])
		.optional(),
	experience: z
		.array(
			z.object({
				company: z.string(),
				position: z.string(),
				years: z.number(),
				start_date: z.string().nullable().optional(),
				end_date: z.string().nullable().optional(),
			}),
		)
		.optional(),
});

type CandidateFormData = z.infer<typeof formSchema>;

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
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: c.name,
			email: c.email ?? "",
			position: c.position,
			status: c.status,
			skills: Array.isArray(c.skills) ? c.skills : [],
			tech: Array.isArray(c.tech) ? c.tech : [],
			education: Array.isArray(c.education)
				? c.education.map((edu) => ({
						organization: edu.organization || "",
						speciality: edu.speciality || "",
						year: (edu as any).year || null,
						type: edu.type || null,
						start_date: edu.start_date || null,
						end_date: edu.end_date || null,
				  }))
				: [],
			geo: c.geo ?? "",
			employment_type: c.employment_type ?? undefined,
			experience: Array.isArray(c.experience)
				? c.experience.map((exp) => ({
						company: exp.company || "",
						position: exp.position || "",
						years: exp.years || 0,
						start_date: exp.start_date || null,
						end_date: exp.end_date || null,
				  }))
				: [],
		},
	});

	const onSubmit = (data: CandidateFormData) => {
		mutation.mutate(
			{
				name: data.name,
				email: data.email,
				position: data.position,
				status: data.status,
				skills: data.skills || [],
				tech: data.tech || [],
				education: data.education || [],
				geo: data.geo || undefined,
				employment_type: data.employment_type,
				experience: data.experience || [],
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
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
										<TagsInput
											{...field}
											value={field.value || []}
											placeholder="Введите навык и нажмите Enter"
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
										<TagsInput
											{...field}
											value={field.value || []}
											placeholder="Введите технологию и нажмите Enter"
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
										<EducationForm
											value={field.value || []}
											onChange={field.onChange}
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
										<ExperienceForm
											value={field.value || []}
											onChange={field.onChange}
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
