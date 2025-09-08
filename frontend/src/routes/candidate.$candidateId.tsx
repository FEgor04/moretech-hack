import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useUpdateCandidate } from "@/api/mutations/candidates";
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
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserIcon, BriefcaseIcon } from "lucide-react";
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
	skills: z.string().optional(),
	tech: z.string().optional(),
	education: z.string().optional(),
	geo: z.string().optional(),
	employment_type: z
		.enum(["полная занятость", "частичная занятость", "контракт", "стажировка"])
		.optional(),
	experience: z.string().optional(),
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

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: candidate.name,
			email: candidate.email || "",
			position: candidate.position,
			status: candidate.status,
			skills: candidate.skills
				? Array.isArray(candidate.skills)
					? candidate.skills.join(", ")
					: candidate.skills
				: "",
			tech: candidate.tech
				? Array.isArray(candidate.tech)
					? candidate.tech.join(", ")
					: candidate.tech
				: "",
			education: candidate.education
				? typeof candidate.education === "string"
					? candidate.education
					: JSON.stringify(candidate.education, null, 2)
				: "",
			geo: candidate.geo || "",
			employment_type:
				(candidate.employment_type as
					| "полная занятость"
					| "частичная занятость"
					| "контракт"
					| "стажировка"
					| undefined) || undefined,
			experience: candidate.experience
				? typeof candidate.experience === "string"
					? candidate.experience
					: JSON.stringify(candidate.experience, null, 2)
				: "",
		},
	});

	const onSubmit = (data: FormData) => {
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

		const candidateData = {
			...data,
			skills: skillsArray || undefined,
			tech: techArray || undefined,
			education: data.education ? JSON.parse(data.education) : undefined,
			experience: data.experience ? JSON.parse(data.experience) : undefined,
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
			pending: { label: "На рассмотрении", variant: "secondary" as const },
			reviewing: { label: "На рассмотрении", variant: "default" as const },
			interviewing: { label: "На собеседовании", variant: "default" as const },
			accepted: {
				label: "Принят",
				variant: "default" as const,
				className: "bg-green-100 text-green-800",
			},
			rejected: { label: "Отклонен", variant: "destructive" as const },
			on_hold: { label: "На удержании", variant: "outline" as const },
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
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>
					<p className="text-gray-600 mt-2">
						Обновите информацию о себе и просматривайте статус ваших заявок
					</p>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* Информация о кандидате */}
					<div className="lg:col-span-2 space-y-6">
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
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="space-y-6"
									>
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
														<FormControl>
															<Input
																{...field}
																placeholder="Полная занятость"
															/>
														</FormControl>
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

										<div className="flex gap-3">
											<Button type="submit" disabled={updateMutation.isPending}>
												{updateMutation.isPending
													? "Сохранение..."
													: "Сохранить изменения"}
											</Button>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>

						{/* Загрузка резюме */}
						<UploadCV
							onSuccess={() => {
								// Можно добавить логику обновления данных после загрузки
							}}
						/>
					</div>

					{/* Статус и информация */}
					<div className="space-y-6">
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
