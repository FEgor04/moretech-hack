import { createFileRoute, Link } from "@tanstack/react-router";
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
import { UserIcon, BriefcaseIcon, ArrowLeftIcon } from "lucide-react";
import { UploadCV } from "@/components/candidates/upload-cv";

const formSchema = z.object({
	name: z.string().min(1, "Имя обязательно"),
	email: z.string().email("Неверный формат email").optional().or(z.literal("")),
	position: z.string().min(1, "Должность обязательна"),
	experience_years: z.number().min(0, "Опыт не может быть отрицательным"),
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
});

type FormData = z.infer<typeof formSchema>;

export const Route = createFileRoute("/candidate/")({
	component: CandidateSelfPage,
});

function CandidateSelfPage() {
	const params = Route.useParams();
	const candidateId = (params as { candidateId: string }).candidateId;
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
			experience_years: candidate.experience_years ?? 0,
			status: candidate.status,
		},
	});

	const onSubmit = (data: FormData) => {
		updateMutation.mutate(data, {
			onSuccess: () => {
				toast.success("Профиль обновлен", {
					description: "Ваш профиль был успешно обновлен.",
				});
			},
			onError: (error) => {
				toast.error("Ошибка обновления профиля", {
					description: error.message,
				});
			},
		});
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return { label: "Ожидает", variant: "secondary" as const };
			case "reviewing":
				return { label: "На рассмотрении", variant: "default" as const };
			case "interviewing":
				return { label: "На собеседовании", variant: "default" as const };
			case "accepted":
				return {
					label: "Принят",
					variant: "default" as const,
					className: "bg-green-500 hover:bg-green-500",
				};
			case "rejected":
				return { label: "Отклонен", variant: "destructive" as const };
			case "on_hold":
				return { label: "В ожидании", variant: "default" as const };
			default:
				return { label: "Неизвестно", variant: "secondary" as const };
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-white border-b">
				<div className="max-w-4xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button variant="outline" asChild>
								<Link to="/candidates">
									<ArrowLeftIcon className="w-4 h-4 mr-2" />
									Вернуться к кандидатам
								</Link>
							</Button>
							<div>
								<h1 className="text-2xl font-bold">Ваш Профиль Кандидата</h1>
								<p className="text-muted-foreground">ID: {candidateId}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto p-6 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Личная информация</CardTitle>
						<CardDescription>
							Обновите ваши данные для более точного подбора вакансий
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
													<Input placeholder="Ваше имя" {...field} />
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
													<Input
														type="email"
														placeholder="Ваш email"
														{...field}
													/>
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
												<FormLabel>Желаемая позиция</FormLabel>
												<FormControl>
													<Input
														placeholder="Например, Frontend Developer"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="experience_years"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Опыт работы (лет)</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="Опыт в годах"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<Button type="submit" disabled={updateMutation.isPending}>
									{updateMutation.isPending
										? "Сохранение..."
										: "Сохранить изменения"}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Загрузить Резюме</CardTitle>
						<CardDescription>
							Загрузите ваше резюме в формате PDF для автоматического анализа
						</CardDescription>
					</CardHeader>
					<CardContent>
						<UploadCV onSuccess={() => {}} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Обзор профиля</CardTitle>
						<CardDescription>
							Текущая информация о вашем профиле
						</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Имя</p>
							<p className="font-medium flex items-center gap-2">
								<UserIcon className="w-4 h-4" />
								{candidate.name}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Email</p>
							<p className="font-medium">{candidate.email || "Не указан"}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Позиция</p>
							<p className="font-medium flex items-center gap-2">
								<BriefcaseIcon className="w-4 h-4" />
								{candidate.position}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Опыт работы</p>
							<p className="font-medium">
								{candidate.experience_years ?? 0} лет
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Статус</p>
							<Badge
								variant={getStatusBadge(candidate.status || "").variant}
								className={
									getStatusBadge(candidate.status || "").className || ""
								}
							>
								{getStatusBadge(candidate.status || "").label}
							</Badge>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Дата создания</p>
							<p className="font-medium">
								{candidate.created_at
									? new Date(candidate.created_at).toLocaleDateString("ru-RU")
									: "Неизвестно"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Последнее обновление
							</p>
							<p className="font-medium">
								{candidate.updated_at
									? new Date(candidate.updated_at).toLocaleDateString("ru-RU")
									: "Неизвестно"}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
