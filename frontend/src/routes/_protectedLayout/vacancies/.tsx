import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { useUpdateVacancy } from "@/api/mutations/vacancies";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeftIcon, 
  BuildingIcon, 
  DollarSignIcon, 
  CalendarIcon,
  ClockIcon
} from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  status: z.enum(["open", "closed"]).optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  employment_type: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
  experience_level: z.enum(["junior", "middle", "senior", "lead"]).optional(),
  remote_work: z.boolean().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

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

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: v.title,
			description: v.description || "",
			status: (v.status as "open" | "closed") || "open",
			company: (v as any).company || "",
			location: (v as any).location || "",
			salary_min: (v as any).salary_min || undefined,
			salary_max: (v as any).salary_max || undefined,
			employment_type: (v as any).employment_type || undefined,
			experience_level: (v as any).experience_level || undefined,
			remote_work: (v as any).remote_work || false,
			requirements: (v as any).requirements || "",
			benefits: (v as any).benefits || "",
		},
	});

	const onSubmit: SubmitHandler<FormData> = (data) => {
		mutation.mutate(data, {
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

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "open":
				return { label: "Открыта", variant: "default" as const, className: "bg-green-500 hover:bg-green-500" };
			case "closed":
				return { label: "Закрыта", variant: "destructive" as const };
			default:
				return { label: "Неизвестно", variant: "secondary" as const };
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-white border-b">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button variant="outline" asChild>
								<Link to="/vacancies">
									<ArrowLeftIcon className="w-4 h-4 mr-2" />
									Назад к вакансиям
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
									{(v as any).company && (
										<span className="text-sm text-muted-foreground flex items-center gap-1">
											<BuildingIcon className="w-4 h-4" />
											{(v as any).company}
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto p-6">
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Основная информация */}
					<Card>
						<CardHeader>
							<CardTitle>Основная информация</CardTitle>
							<CardDescription>
								Название, описание и статус вакансии
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="title">Название вакансии *</Label>
									<Input
										id="title"
										{...form.register("title")}
										placeholder="Например, Frontend Developer"
									/>
									{form.formState.errors.title && (
										<p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="status">Статус</Label>
									<Select onValueChange={(value) => form.setValue("status", value as "open" | "closed")} 
											defaultValue={form.watch("status")}>
										<SelectTrigger>
											<SelectValue placeholder="Выберите статус" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="open">Открыта</SelectItem>
											<SelectItem value="closed">Закрыта</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Описание</Label>
								<Textarea
									id="description"
									{...form.register("description")}
									placeholder="Подробное описание вакансии..."
									rows={4}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Информация о компании */}
					<Card>
						<CardHeader>
							<CardTitle>Информация о компании</CardTitle>
							<CardDescription>
								Название компании и местоположение
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="company">Компания</Label>
									<Input
										id="company"
										{...form.register("company")}
										placeholder="Название компании"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="location">Местоположение</Label>
									<Input
										id="location"
										{...form.register("location")}
										placeholder="Город, страна"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Условия работы */}
					<Card>
						<CardHeader>
							<CardTitle>Условия работы</CardTitle>
							<CardDescription>
								Зарплата, тип занятости и уровень опыта
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="space-y-2">
									<Label htmlFor="salary_min">Зарплата от (₽)</Label>
									<Input
										id="salary_min"
										type="number"
										{...form.register("salary_min")}
										placeholder="50000"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="salary_max">Зарплата до (₽)</Label>
									<Input
										id="salary_max"
										type="number"
										{...form.register("salary_max")}
										placeholder="100000"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="employment_type">Тип занятости</Label>
									<Select onValueChange={(value) => form.setValue("employment_type", value as any)} 
											defaultValue={form.watch("employment_type")}>
										<SelectTrigger>
											<SelectValue placeholder="Выберите тип" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="full_time">Полная занятость</SelectItem>
											<SelectItem value="part_time">Частичная занятость</SelectItem>
											<SelectItem value="contract">Контракт</SelectItem>
											<SelectItem value="internship">Стажировка</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="experience_level">Уровень опыта</Label>
									<Select onValueChange={(value) => form.setValue("experience_level", value as any)} 
											defaultValue={form.watch("experience_level")}>
										<SelectTrigger>
											<SelectValue placeholder="Выберите уровень" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="junior">Junior</SelectItem>
											<SelectItem value="middle">Middle</SelectItem>
											<SelectItem value="senior">Senior</SelectItem>
											<SelectItem value="lead">Lead</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="remote_work"
									{...form.register("remote_work")}
									className="rounded border-gray-300"
								/>
								<Label htmlFor="remote_work">Удаленная работа</Label>
							</div>
						</CardContent>
					</Card>

					{/* Требования и преимущества */}
					<Card>
						<CardHeader>
							<CardTitle>Требования и преимущества</CardTitle>
							<CardDescription>
								Что мы ожидаем от кандидата и что мы предлагаем
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="requirements">Требования</Label>
								<Textarea
									id="requirements"
									{...form.register("requirements")}
									placeholder="Опишите требования к кандидату..."
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="benefits">Преимущества</Label>
								<Textarea
									id="benefits"
									{...form.register("benefits")}
									placeholder="Опишите преимущества работы в компании..."
									rows={3}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Кнопки действий */}
					<div className="flex justify-end gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate({ to: "/vacancies" })}
						>
							Отмена
						</Button>
						<Button
							type="submit"
							disabled={mutation.isPending}
						>
							{mutation.isPending ? "Сохранение..." : "Сохранить изменения"}
						</Button>
					</div>
				</form>

				{/* Информация о вакансии */}
				<Card className="mt-6">
					<CardHeader>
						<CardTitle>Информация о вакансии</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div className="flex items-center gap-2">
							<CalendarIcon className="w-4 h-4 text-muted-foreground" />
							<div>
								<p className="text-sm text-muted-foreground">Создана</p>
								<p className="font-medium">
									{v.created_at ? new Date(v.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<ClockIcon className="w-4 h-4 text-muted-foreground" />
							<div>
								<p className="text-sm text-muted-foreground">Обновлена</p>
								<p className="font-medium">
									{v.updated_at ? new Date(v.updated_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
								</p>
							</div>
						</div>
						{(v as any).salary_min && (v as any).salary_max && (
							<div className="flex items-center gap-2">
								<DollarSignIcon className="w-4 h-4 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">Зарплата</p>
									<p className="font-medium">
										{(v as any).salary_min.toLocaleString()} - {(v as any).salary_max.toLocaleString()} ₽
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
