import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { useUpdateVacancy } from "@/api/mutations/vacancies";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { VacancyRead } from "@/api/client/types.gen";
import { vacancyNotesQueryOptions } from "@/api/queries/vacancies";
import { useCreateVacancyNote } from "@/api/mutations/vacancies";
import { RelativeTimeTooltip } from "@/components/ui/relative-time-tooltip";

// Расширенный тип для вакансии с дополнительными полями
type ExtendedVacancy = VacancyRead & {
	company?: string | null;
	experience_level?: string | null;
	benefits?: string | null;
};
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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDeleteVacancyNote } from "@/api/mutations/vacancies";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	ArrowLeftIcon,
	BriefcaseIcon,
	BuildingIcon,
	MapPinIcon,
	DollarSignIcon,
	ClockIcon,
	UsersIcon,
	BarChart3Icon,
} from "lucide-react";

const employmentTypeLocalization = {
	part_time: "Частичная занятость",
	full_time: "Полная занятость",
	contract: "Контракт",
	internship: "Стажировка",
} as const;

const noteFormSchema = z.object({
	text: z.string().min(1, "Заметка не может быть пустой"),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

const formSchema = z.object({
	title: z.string().min(1, "Название обязательно"),
	description: z.string().optional(),
	status: z.enum(["open", "closed"]).optional(),
	company: z.string().optional(),
	location: z.string().optional(),
	salary_min: z.number().optional(),
	salary_max: z.number().optional(),
	employment_type: z
		.enum(["полная занятость", "частичная занятость", "контракт", "стажировка"])
		.optional(),
	experience_level: z
		.enum(["младший", "средний", "старший", "ведущий"])
		.optional(),
	requirements: z.string().optional(),
	benefits: z.string().optional(),
	skills: z.string().optional(),
	responsibilities: z.string().optional(),
	domain: z.string().optional(),
	education: z.string().optional(),
	minor_skills: z.string().optional(),
	company_info: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const Route = createFileRoute("/_protectedLayout/vacancies/$vacancyId/")(
	{
		component: VacancyDetail,
		loader: async ({ params, context }) => {
			const vacancy = await context.queryClient.fetchQuery(
				vacancyQueryOptions(Number(params.vacancyId)),
			);
			return { vacancy };
		},
	},
);

function VacancyDetail() {
	const params = Route.useParams();
	const navigate = useNavigate();
	const vacancy = useSuspenseQuery(
		vacancyQueryOptions(Number(params.vacancyId)),
	);
	const notes = useSuspenseQuery(
		vacancyNotesQueryOptions(Number(params.vacancyId)),
	);
	const createNote = useCreateVacancyNote(Number(params.vacancyId));
	const deleteNote = useDeleteVacancyNote(Number(params.vacancyId));

	const noteForm = useForm<NoteFormData>({
		resolver: zodResolver(noteFormSchema),
		defaultValues: {
			text: "",
		},
	});

	const mutation = useUpdateVacancy(Number(params.vacancyId));
	const v = vacancy.data as ExtendedVacancy;

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: v.title,
			description: v.description || "",
			status: (v.status as "open" | "closed") || "open",
			company: v.company || "",
			location: v.location || "",
			salary_min: v.salary_min || undefined,
			salary_max: v.salary_max || undefined,
			employment_type:
				(v.employment_type as
					| "полная занятость"
					| "частичная занятость"
					| "контракт"
					| "стажировка"
					| undefined) || undefined,
			experience_level:
				(v.experience_level as
					| "младший"
					| "средний"
					| "старший"
					| "ведущий"
					| undefined) || undefined,
			requirements: v.requirements || "",
			benefits: v.benefits || "",
			skills: v.skills
				? Array.isArray(v.skills)
					? v.skills.join(", ")
					: v.skills
				: "",
			responsibilities: v.responsibilities
				? Array.isArray(v.responsibilities)
					? v.responsibilities.join(", ")
					: v.responsibilities
				: "",
			domain: v.domain || "",
			education: v.education || "",
			minor_skills: v.minor_skills
				? Array.isArray(v.minor_skills)
					? v.minor_skills.join(", ")
					: v.minor_skills
				: "",
			company_info: v.company_info || "",
		},
	});

	const onSubmit = (data: FormData) => {
		// Преобразуем строки навыков в массивы
		const skillsArray = data.skills
			? data.skills
					.split(",")
					.map((skill) => skill.trim())
					.filter((skill) => skill.length > 0)
			: undefined;

		const responsibilitiesArray = data.responsibilities
			? data.responsibilities
					.split(",")
					.map((resp) => resp.trim())
					.filter((resp) => resp.length > 0)
			: undefined;

		const minorSkillsArray = data.minor_skills
			? data.minor_skills
					.split(",")
					.map((skill) => skill.trim())
					.filter((skill) => skill.length > 0)
			: undefined;

		const vacancyData = {
			...data,
			skills: skillsArray || undefined,
			responsibilities: responsibilitiesArray || undefined,
			minor_skills: minorSkillsArray || undefined,
		};

		mutation.mutate(vacancyData, {
			onSuccess: () => {
				toast.success("Вакансия обновлена", {
					description: "Изменения успешно сохранены.",
				});
				navigate({ to: "/vacancies" });
			},
			onError: (error) => {
				toast.error("Ошибка при обновлении вакансии", {
					description: error.message,
				});
			},
		});
	};

	const onNoteSubmit = (data: NoteFormData) => {
		createNote.mutate(data.text, {
			onSuccess: () => {
				noteForm.reset();
				toast.success("Заметка добавлена");
			},
			onError: (err) => {
				toast.error("Не удалось добавить заметку", {
					description: err.message,
				});
			},
		});
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "open":
				return {
					label: "🟢 Открыта",
					variant: "default" as const,
					className:
						"bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
				};
			case "closed":
				return {
					label: "🔴 Закрыта",
					variant: "secondary" as const,
					className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
				};
			default:
				return {
					label: "❓ Неизвестно",
					variant: "secondary" as const,
					className: "bg-gray-100 text-gray-800 border-gray-200",
				};
		}
	};

	return (
		<div>
			<div className="bg-white border-b">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button variant="outline" size="sm" asChild>
								<Link to="/vacancies">
									<ArrowLeftIcon className="w-4 h-4" />
									<span className="sr-only">Назад к вакансиям</span>
								</Link>
							</Button>
							<div>
								<h1 className="text-2xl font-bold">{v.title}</h1>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant={getStatusBadge(v.status || "").variant}
										className={getStatusBadge(v.status || "").className || ""}
									>
										{getStatusBadge(v.status || "").label}
									</Badge>
									{v.company && (
										<span className="text-sm text-muted-foreground flex items-center gap-1">
											<BuildingIcon className="w-4 h-4" />
											{v.company}
										</span>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" asChild>
								<Link
									to="/vacancies/$vacancyId/stats"
									params={{ vacancyId: params.vacancyId }}
								>
									<BarChart3Icon className="w-4 h-4 mr-1" /> Статистика
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto p-6">
				<div className="grid gap-6 lg:grid-cols-3">
					{/* Основная информация */}
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BriefcaseIcon className="h-5 w-5" />
									Информация о вакансии
								</CardTitle>
								<CardDescription>
									Редактируйте основную информацию о вакансии
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="space-y-6"
									>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="title"
												render={({ field }) => (
													<FormItem className="md:col-span-2">
														<FormLabel>Название вакансии</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="company"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Компания</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="location"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Местоположение</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="salary_min"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Минимальная зарплата</FormLabel>
														<FormControl>
															<Input
																type="number"
																{...field}
																onChange={(e) =>
																	field.onChange(
																		e.target.value
																			? Number(e.target.value)
																			: undefined,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="salary_max"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Максимальная зарплата</FormLabel>
														<FormControl>
															<Input
																type="number"
																{...field}
																onChange={(e) =>
																	field.onChange(
																		e.target.value
																			? Number(e.target.value)
																			: undefined,
																	)
																}
															/>
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
																<SelectTrigger className="w-full">
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
																<SelectItem value="контракт">
																	Контракт
																</SelectItem>
																<SelectItem value="стажировка">
																	Стажировка
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="experience_level"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Уровень опыта</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Выберите уровень опыта" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="младший">Младший</SelectItem>
																<SelectItem value="средний">Средний</SelectItem>
																<SelectItem value="старший">Старший</SelectItem>
																<SelectItem value="ведущий">Ведущий</SelectItem>
															</SelectContent>
														</Select>
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
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Выберите статус" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="open">Открыта</SelectItem>
																<SelectItem value="closed">Закрыта</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={form.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Описание</FormLabel>
													<FormControl>
														<Textarea rows={4} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="requirements"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Требования</FormLabel>
													<FormControl>
														<Textarea rows={3} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="benefits"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Преимущества</FormLabel>
													<FormControl>
														<Textarea rows={3} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="skills"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Требуемые навыки</FormLabel>
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
											name="responsibilities"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Обязанности</FormLabel>
													<FormControl>
														<Textarea
															{...field}
															placeholder="Введите обязанности через запятую"
															rows={4}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="domain"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Домен/Отрасль</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="IT, Финансы, Медицина и т.д."
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="education"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Требования к образованию</FormLabel>
													<FormControl>
														<Textarea rows={3} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="minor_skills"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Дополнительные навыки</FormLabel>
													<FormControl>
														<Textarea
															{...field}
															placeholder="Введите дополнительные навыки через запятую"
															rows={3}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="company_info"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Информация о компании</FormLabel>
													<FormControl>
														<Textarea rows={4} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="flex gap-3">
											<Button type="submit" disabled={mutation.isPending}>
												{mutation.isPending
													? "Сохранение..."
													: "Сохранить изменения"}
											</Button>
											<Button type="button" variant="outline" asChild>
												<Link to="/vacancies">Отмена</Link>
											</Button>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>
					</div>

					{/* Боковая панель с информацией */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Детали вакансии</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-2 text-sm">
									<BriefcaseIcon className="w-4 h-4 text-muted-foreground" />
									<span className="text-muted-foreground">ID вакансии:</span>
									<code className="text-xs bg-gray-100 px-2 py-1 rounded">
										{params.vacancyId}
									</code>
								</div>

								{v.salary_min && v.salary_max && (
									<div className="flex items-center gap-2 text-sm">
										<DollarSignIcon className="w-4 h-4 text-muted-foreground" />
										<span className="text-muted-foreground">Зарплата:</span>
										<span>
											{v.salary_min} - {v.salary_max} ₽
										</span>
									</div>
								)}

								{v.location && (
									<div className="flex items-center gap-2 text-sm">
										<MapPinIcon className="w-4 h-4 text-muted-foreground" />
										<span className="text-muted-foreground">
											Местоположение:
										</span>
										<span>{v.location}</span>
									</div>
								)}

								{v.employment_type && (
									<div className="flex items-center gap-2 text-sm">
										<ClockIcon className="w-4 h-4 text-muted-foreground" />
										<span className="text-muted-foreground">
											Тип занятости:
										</span>
										<span>
											{employmentTypeLocalization[
												v.employment_type as keyof typeof employmentTypeLocalization
											] || v.employment_type}
										</span>
									</div>
								)}

								{v.experience_level && (
									<div className="flex items-center gap-2 text-sm">
										<UsersIcon className="w-4 h-4 text-muted-foreground" />
										<span className="text-muted-foreground">Уровень:</span>
										<span>{v.experience_level}</span>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Заметки</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Form {...noteForm}>
									<form
										onSubmit={noteForm.handleSubmit(onNoteSubmit)}
										className="flex gap-2"
									>
										<FormField
											control={noteForm.control}
											name="text"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormControl>
														<Input
															{...field}
															placeholder="Оставить заметку..."
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button type="submit" disabled={createNote.isPending}>
											{createNote.isPending ? "Добавление..." : "Добавить"}
										</Button>
									</form>
								</Form>

								<div className="space-y-3 max-h-80 overflow-auto pr-1">
									{notes.data?.length ? (
										notes.data.map((n) => (
											<div
												key={n.id}
												className="p-3 border rounded-md text-sm relative"
											>
												<Button
													variant="ghost"
													size="icon"
													className="absolute top-1 right-1 h-6 w-6"
													onClick={() => deleteNote.mutate(n.id)}
												>
													<span className="sr-only">Удалить</span>×
												</Button>
												<div className="text-muted-foreground text-xs mb-1 pr-6">
													<RelativeTimeTooltip
														date={new Date(n.created_at || "")}
													/>
												</div>
												<div className="whitespace-pre-wrap">{n.text}</div>
											</div>
										))
									) : (
										<div className="text-sm text-muted-foreground">
											Заметок пока нет
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
