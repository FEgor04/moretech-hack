import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useUpdateCandidate } from "@/api/mutations/candidates";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserIcon, BriefcaseIcon, EditIcon, EyeIcon } from "lucide-react";
import { UploadCV } from "@/components/candidates/upload-cv";

const formSchema = z.object({
	name: z.string().min(1, "Имя обязательно"),
	email: z.string().email("Неверный формат email").optional().or(z.literal("")),
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
				organization: z.string().min(1, "Учебное заведение обязательно"),
				speciality: z.string().min(1, "Специальность обязательна"),
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
				company: z.string().min(1, "Компания обязательна"),
				position: z.string().min(1, "Должность обязательна"),
				years: z.number().min(0, "Опыт не может быть отрицательным"),
				start_date: z.string().nullable().optional(),
				end_date: z.string().nullable().optional(),
			}),
		)
		.optional(),
});

type FormData = z.infer<typeof formSchema>;

export const Route = createFileRoute("/candidate/$candidateId")({
	component: CandidateSelfPage,
});

function CandidateSelfPage() {
	const { candidateId } = Route.useParams();
	const { data: candidate } = useSuspenseQuery(
		candidateQueryOptions(candidateId),
	);
	const updateMutation = useUpdateCandidate(candidateId);
	const [isEditing, setIsEditing] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: candidate.name,
			email: candidate.email || "",
			position: candidate.position,
			status: candidate.status,
			skills: candidate.skills
				? Array.isArray(candidate.skills)
					? candidate.skills
					: [candidate.skills]
				: [],
			tech: candidate.tech
				? Array.isArray(candidate.tech)
					? candidate.tech
					: [candidate.tech]
				: [],
			education: candidate.education
				? Array.isArray(candidate.education)
					? candidate.education.map((edu) => ({
							...edu,
							type: edu.type || null,
							start_date: edu.start_date || null,
							end_date: edu.end_date || null,
						}))
					: []
				: [],
			geo: candidate.geo || "",
			employment_type:
				(candidate.employment_type as
					| "полная занятость"
					| "частичная занятость"
					| "контракт"
					| "стажировка"
					| undefined) || undefined,
			experience: candidate.experience
				? Array.isArray(candidate.experience)
					? candidate.experience.map((exp) => ({
							...exp,
							start_date: exp.start_date || null,
							end_date: exp.end_date || null,
						}))
					: []
				: [],
		},
	});

	const onSubmit = (data: FormData) => {
		const candidateData = {
			...data,
			skills: data.skills || [],
			tech: data.tech || [],
			education: data.education || [],
			experience: data.experience || [],
		};

		updateMutation.mutate(candidateData, {
			onSuccess: () => {
				toast.success("Информация обновлена");
			},
			onError: () => {
				toast.error("Ошибка при обновлении информации");
			},
		});
	};

	const getStatusBadge = (status: string) => {
		const statusMap = {
			pending: { label: "В ожидании", variant: "secondary" as const },
			reviewing: { label: "На рассмотрении", variant: "default" as const },
			interviewing: { label: "Собеседование", variant: "default" as const },
			accepted: {
				label: "Принят",
				variant: "default" as const,
				className: "bg-green-100 text-green-800",
			},
			rejected: { label: "Отклонен", variant: "destructive" as const },
			on_hold: { label: "Приостановлен", variant: "outline" as const },
		};
		const statusInfo = statusMap[status as keyof typeof statusMap] || {
			label: status,
			variant: "secondary" as const,
		};
		return (
			<Badge
				variant={statusInfo.variant}
				className={"className" in statusInfo ? statusInfo.className : ""}
			>
				{statusInfo.label}
			</Badge>
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 py-6 sm:py-8 overflow-x-hidden">
			<div className="max-w-3xl lg:max-w-4xl mx-auto px-4">
				<div className="mb-6 sm:mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
								Мой профиль
							</h1>
							<p className="text-gray-600 mt-2">
								{isEditing
									? "Обновите информацию о себе и просматривайте статус ваших заявок"
									: "Просматривайте информацию о себе и статус ваших заявок"}
							</p>
						</div>
						<Button
							variant="outline"
							onClick={() => setIsEditing(!isEditing)}
							className="flex items-center gap-2"
						>
							{isEditing ? (
								<>
									<EyeIcon className="h-4 w-4" />
									Режим просмотра
								</>
							) : (
								<>
									<EditIcon className="h-4 w-4" />
									Режим редактирования
								</>
							)}
						</Button>
					</div>
				</div>

				<div className="grid gap-4 sm:gap-6 lg:grid-cols-3 min-w-0">
					{/* Информация о кандидате */}
					<div className="lg:col-span-2 space-y-6 min-w-0">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<UserIcon className="h-5 w-5" />
									Личная информация
								</CardTitle>
								<CardDescription>
									Обновите свои данные для работодателей
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isEditing ? (
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(onSubmit)}
											className="space-y-8"
										>
											<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
															<FormLabel>Желаемая должность</FormLabel>
															<FormControl>
																<Input {...field} />
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
																<Input
																	{...field}
																	placeholder="Москва, Россия"
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
																	<SelectItem value="pending">
																		В ожидании
																	</SelectItem>
																	<SelectItem value="reviewing">
																		На рассмотрении
																	</SelectItem>
																	<SelectItem value="interviewing">
																		Собеседование
																	</SelectItem>
																	<SelectItem value="accepted">
																		Принят
																	</SelectItem>
																	<SelectItem value="rejected">
																		Отклонен
																	</SelectItem>
																	<SelectItem value="on_hold">
																		Приостановлен
																	</SelectItem>
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
																value={field.value || []}
																onChange={field.onChange}
																placeholder="Введите навык и нажмите Enter..."
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
																value={field.value || []}
																onChange={field.onChange}
																placeholder="Введите технологию и нажмите Enter..."
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

											<div className="flex gap-3">
												<Button
													type="submit"
													disabled={updateMutation.isPending}
												>
													{updateMutation.isPending
														? "Сохранение..."
														: "Сохранить изменения"}
												</Button>
												<Button
													type="button"
													variant="outline"
													onClick={() => setIsEditing(false)}
												>
													Отмена
												</Button>
											</div>
										</form>
									</Form>
								) : (
									<div className="space-y-8">
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div className="space-y-2">
												<div className="text-sm font-medium text-gray-700">
													Имя
												</div>
												<p className="text-sm text-gray-900">
													{candidate.name}
												</p>
											</div>
											<div className="space-y-2">
												<div className="text-sm font-medium text-gray-700">
													Email
												</div>
												<p className="text-sm text-gray-900">
													{candidate.email || "Не указан"}
												</p>
											</div>
											<div className="space-y-2">
												<div className="text-sm font-medium text-gray-700">
													Желаемая должность
												</div>
												<p className="text-sm text-gray-900">
													{candidate.position}
												</p>
											</div>
											<div className="space-y-2">
												<div className="text-sm font-medium text-gray-700">
													Местоположение
												</div>
												<p className="text-sm text-gray-900">
													{candidate.geo || "Не указано"}
												</p>
											</div>
											<div className="space-y-2">
												<div className="text-sm font-medium text-gray-700">
													Тип занятости
												</div>
												<p className="text-sm text-gray-900">
													{candidate.employment_type || "Не указан"}
												</p>
											</div>
											<div className="space-y-2">
												<div className="text-sm font-medium text-gray-700">
													Статус
												</div>
												<div className="flex items-center gap-2">
													{getStatusBadge(candidate.status || "pending")}
												</div>
											</div>
										</div>

										{candidate.skills && (
											<div className="space-y-3">
												<div className="text-sm font-medium text-gray-700">
													Ключевые навыки
												</div>
												<div className="flex flex-wrap gap-2">
													{Array.isArray(candidate.skills) ? (
														candidate.skills.map((skill) => (
															<Badge
																key={skill}
																variant="secondary"
																className="text-xs"
															>
																{skill}
															</Badge>
														))
													) : (
														<Badge variant="secondary" className="text-xs">
															{candidate.skills}
														</Badge>
													)}
												</div>
											</div>
										)}

										{candidate.tech && (
											<div className="space-y-3">
												<div className="text-sm font-medium text-gray-700">
													Технологии
												</div>
												<div className="flex flex-wrap gap-2">
													{Array.isArray(candidate.tech) ? (
														candidate.tech.map((tech) => (
															<Badge
																key={tech}
																variant="outline"
																className="text-xs"
															>
																{tech}
															</Badge>
														))
													) : (
														<Badge variant="outline" className="text-xs">
															{candidate.tech}
														</Badge>
													)}
												</div>
											</div>
										)}

										{candidate.education && (
											<div className="space-y-4">
												<div className="text-sm font-medium text-gray-700">
													Образование
												</div>
												<div className="space-y-3">
													{(() => {
														try {
															const educationData =
																typeof candidate.education === "string"
																	? JSON.parse(candidate.education)
																	: candidate.education;

															if (Array.isArray(educationData)) {
																return educationData.map((edu, index) => (
																	<div
																		key={`edu-${edu.organization}-${edu.speciality}-${index}`}
																		className="p-3 bg-blue-50 rounded-lg border border-blue-200"
																	>
																		<div className="flex items-start justify-between">
																			<div className="flex-1">
																				<h4 className="font-medium text-blue-900">
																					{edu.organization || "Не указано"}
																				</h4>
																				{edu.speciality && (
																					<p className="text-sm text-blue-700 mt-1">
																						{edu.speciality}
																					</p>
																				)}
																				{(edu.start_date || edu.end_date) && (
																					<p className="text-xs text-blue-600 mt-1">
																						{edu.start_date &&
																							new Date(
																								edu.start_date,
																							).toLocaleDateString("ru-RU")}
																						{edu.start_date &&
																							edu.end_date &&
																							" - "}
																						{edu.end_date &&
																							new Date(
																								edu.end_date,
																							).toLocaleDateString("ru-RU")}
																					</p>
																				)}
																			</div>
																			<Badge
																				variant="outline"
																				className="bg-blue-100 text-blue-800 border-blue-300"
																			>
																				{edu.type || "Не указано"}
																			</Badge>
																		</div>
																	</div>
																));
															}
															return (
																<div className="p-3 bg-gray-50 rounded-lg">
																	<pre className="text-sm whitespace-pre-wrap">
																		{typeof candidate.education === "string"
																			? candidate.education
																			: JSON.stringify(
																					candidate.education,
																					null,
																					2,
																				)}
																	</pre>
																</div>
															);
														} catch {
															return (
																<div className="p-3 bg-gray-50 rounded-lg">
																	<pre className="text-sm whitespace-pre-wrap">
																		{typeof candidate.education === "string"
																			? candidate.education
																			: JSON.stringify(
																					candidate.education,
																					null,
																					2,
																				)}
																	</pre>
																</div>
															);
														}
													})()}
												</div>
											</div>
										)}

										{candidate.experience && (
											<div className="space-y-4">
												<div className="text-sm font-medium text-gray-700">
													Детальный опыт работы
												</div>
												<div className="space-y-3">
													{(() => {
														try {
															const experienceData =
																typeof candidate.experience === "string"
																	? JSON.parse(candidate.experience)
																	: candidate.experience;

															if (Array.isArray(experienceData)) {
																return experienceData.map((exp, index) => (
																	<div
																		key={`exp-${exp.company}-${exp.position}-${index}`}
																		className="p-3 bg-green-50 rounded-lg border border-green-200"
																	>
																		<div className="flex items-start justify-between">
																			<div className="flex-1">
																				<h4 className="font-medium text-green-900">
																					{exp.company || "Не указано"}
																				</h4>
																				<p className="text-sm text-green-700 mt-1">
																					{exp.position || "Не указано"}
																				</p>
																				{(exp.start_date || exp.end_date) && (
																					<p className="text-xs text-green-600 mt-1">
																						{exp.start_date &&
																							new Date(
																								exp.start_date,
																							).toLocaleDateString("ru-RU")}
																						{exp.start_date &&
																							exp.end_date &&
																							" - "}
																						{exp.end_date &&
																							new Date(
																								exp.end_date,
																							).toLocaleDateString("ru-RU")}
																					</p>
																				)}
																			</div>
																			{exp.years && (
																				<Badge
																					variant="outline"
																					className="bg-green-100 text-green-800 border-green-300"
																				>
																					{exp.years}{" "}
																					{exp.years === 1
																						? "год"
																						: exp.years < 5
																							? "года"
																							: "лет"}
																				</Badge>
																			)}
																		</div>
																	</div>
																));
															}
															return (
																<div className="p-3 bg-gray-50 rounded-lg">
																	<pre className="text-sm whitespace-pre-wrap">
																		{typeof candidate.experience === "string"
																			? candidate.experience
																			: JSON.stringify(
																					candidate.experience,
																					null,
																					2,
																				)}
																	</pre>
																</div>
															);
														} catch {
															return (
																<div className="p-3 bg-gray-50 rounded-lg">
																	<pre className="text-sm whitespace-pre-wrap">
																		{typeof candidate.experience === "string"
																			? candidate.experience
																			: JSON.stringify(
																					candidate.experience,
																					null,
																					2,
																				)}
																	</pre>
																</div>
															);
														}
													})()}
												</div>
											</div>
										)}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Загрузка резюме */}
						{isEditing && (
							<UploadCV
								onSuccess={() => {
									// Можно добавить логику обновления данных после загрузки
								}}
							/>
						)}
					</div>

					{/* Статус и информация */}
					<div className="space-y-6 min-w-0">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BriefcaseIcon className="h-5 w-5" />
									Текущий статус
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<p className="text-sm text-gray-600 mb-2">Статус заявки</p>
										{getStatusBadge(candidate.status || "pending")}
									</div>
									<div>
										<p className="text-sm text-gray-600 mb-2">Дата создания</p>
										<p className="text-sm font-medium">
											{candidate.created_at
												? new Date(candidate.created_at).toLocaleDateString(
														"ru-RU",
													)
												: "Не указана"}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-600 mb-2">
											Последнее обновление
										</p>
										<p className="text-sm font-medium">
											{candidate.updated_at
												? new Date(candidate.updated_at).toLocaleDateString(
														"ru-RU",
													)
												: "Не указана"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Информация</CardTitle>
								<CardDescription>
									Ваш уникальный ID для связи с работодателями
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<p className="text-sm text-gray-600">ID кандидата</p>
									<code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
										{candidateId}
									</code>
									<p className="text-xs text-gray-500 mt-2">
										Поделитесь этим ID с работодателями для быстрого поиска
										вашего профиля
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
