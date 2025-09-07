import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import { interviewsQueryOptions } from "@/api/queries/interviews";
import type { VacancyRead } from "@/api/client/types.gen";

// Расширенный тип для вакансии с дополнительными полями
type ExtendedVacancy = VacancyRead & {
	company?: string | null;
	experience_level?: string | null;
	remote_work?: boolean;
	benefits?: string | null;
};
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	BarChart3Icon,
	UsersIcon,
	MessageSquareIcon,
	CheckCircleIcon,
	XCircleIcon,
	ClockIcon,
	TrendingUpIcon,
	DollarSignIcon,
	MapPinIcon,
	BuildingIcon,
	CalendarIcon,
	UserCheckIcon,
	UserXIcon,
	AlertCircleIcon,
} from "lucide-react";

interface VacancyStatsModalProps {
	vacancy: ExtendedVacancy;
	children: React.ReactNode;
}

export function VacancyStatsModal({
	vacancy,
	children,
}: VacancyStatsModalProps) {
	const [open, setOpen] = useState(false);

	const { data: candidates } = useSuspenseQuery(candidatesQueryOptions());
	const { data: interviews } = useSuspenseQuery(interviewsQueryOptions());

	// Фильтруем кандидатов, которые подходят под эту вакансию
	// (в реальном приложении это было бы более сложная логика сопоставления)
	const relevantCandidates = candidates.filter((candidate) => {
		// Простая логика: кандидаты с похожим опытом и позицией
		const experienceMatch =
			vacancy.experience_level === "junior"
				? (candidate.experience_years ?? 0) <= 2
				: vacancy.experience_level === "middle"
					? (candidate.experience_years ?? 0) >= 2 && (candidate.experience_years ?? 0) <= 5
					: vacancy.experience_level === "senior"
						? (candidate.experience_years ?? 0) >= 5 && (candidate.experience_years ?? 0) <= 8
						: vacancy.experience_level === "lead"
							? (candidate.experience_years ?? 0) >= 8
							: true;

		const positionMatch =
			candidate.position.toLowerCase().includes(vacancy.title.toLowerCase()) ||
			vacancy.title.toLowerCase().includes(candidate.position.toLowerCase());

		return experienceMatch || positionMatch;
	});

	// Интервью для этой вакансии
	const vacancyInterviews = interviews.filter(
		(interview) => interview.vacancy_id === vacancy.id,
	);

	// Статистика по кандидатам
	const totalCandidates = relevantCandidates.length;
	const pendingCandidates = relevantCandidates.filter(
		(c) => c.status === "pending",
	).length;
	const reviewingCandidates = relevantCandidates.filter(
		(c) => c.status === "reviewing",
	).length;
	const interviewingCandidates = relevantCandidates.filter(
		(c) => c.status === "interviewing",
	).length;
	const acceptedCandidates = relevantCandidates.filter(
		(c) => c.status === "accepted",
	).length;
	const rejectedCandidates = relevantCandidates.filter(
		(c) => c.status === "rejected",
	).length;
	const onHoldCandidates = relevantCandidates.filter(
		(c) => c.status === "on_hold",
	).length;

	// Статистика по интервью
	const totalInterviews = vacancyInterviews.length;
	const completedInterviews = vacancyInterviews.filter(
		(i) => i.status === "завершено",
	).length;
	const activeInterviews = vacancyInterviews.filter(
		(i) => i.status === "на собеседовании",
	).length;
	const positiveFeedback = vacancyInterviews.filter(
		(i) => i.feedback_positive === true,
	).length;
	const negativeFeedback = vacancyInterviews.filter(
		(i) => i.feedback_positive === false,
	).length;

	// Конверсия
	const conversionRate =
		totalCandidates > 0
			? Math.round((acceptedCandidates / totalCandidates) * 100)
			: 0;

	// Время открытия вакансии
	const daysOpen = vacancy.created_at
		? Math.floor(
				(Date.now() - new Date(vacancy.created_at).getTime()) /
					(1000 * 60 * 60 * 24),
			)
		: 0;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BarChart3Icon className="h-5 w-5" />
						Статистика по вакансии: {vacancy.title}
					</DialogTitle>
					<DialogDescription>
						Детальная аналитика по вакансии и связанным кандидатам
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Информация о вакансии */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BuildingIcon className="h-5 w-5" />
								Информация о вакансии
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								<div className="flex items-center gap-3">
									<BuildingIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground">Компания</p>
										<p className="text-sm font-medium">
											{vacancy.company || "Не указана"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<MapPinIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground">Локация</p>
										<p className="text-sm font-medium">
											{vacancy.location || "Не указана"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<DollarSignIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground">Зарплата</p>
										<p className="text-sm font-medium">
											{vacancy.salary_min && vacancy.salary_max
												? `${Math.round(vacancy.salary_min / 1000)}k - ${Math.round(vacancy.salary_max / 1000)}k ₽`
												: "Не указана"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<ClockIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground">
											Тип занятости
										</p>
										<p className="text-sm font-medium">
											{vacancy.employment_type || "Не указан"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground">Уровень</p>
										<p className="text-sm font-medium">
											{vacancy.experience_level || "Не указан"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<CalendarIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground">Открыта</p>
										<p className="text-sm font-medium">{daysOpen} дней</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Основные метрики */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Подходящие кандидаты
								</CardTitle>
								<UsersIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalCandidates}</div>
								<p className="text-xs text-muted-foreground">
									<span className="text-blue-600">{pendingCandidates}</span> на
									рассмотрении
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Интервью</CardTitle>
								<MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalInterviews}</div>
								<p className="text-xs text-muted-foreground">
									<span className="text-orange-600">{activeInterviews}</span>{" "}
									активных
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Конверсия</CardTitle>
								<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{conversionRate}%</div>
								<p className="text-xs text-muted-foreground">
									<span className="text-green-600">{acceptedCandidates}</span>{" "}
									принято
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Статус</CardTitle>
								<CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									<Badge
										variant={
											vacancy.status === "open" ? "default" : "secondary"
										}
										className={
											vacancy.status === "open"
												? "bg-green-100 text-green-800"
												: ""
										}
									>
										{vacancy.status === "open" ? "Открыта" : "Закрыта"}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground">
									{daysOpen} дней в работе
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Детальная статистика */}
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<UsersIcon className="h-5 w-5" />
									Статусы кандидатов
								</CardTitle>
								<CardDescription>
									Распределение подходящих кандидатов
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<AlertCircleIcon className="h-4 w-4 text-yellow-500" />
										<span className="text-sm">На рассмотрении</span>
									</div>
									<Badge variant="secondary">{pendingCandidates}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<ClockIcon className="h-4 w-4 text-blue-500" />
										<span className="text-sm">На рассмотрении</span>
									</div>
									<Badge variant="default">{reviewingCandidates}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<MessageSquareIcon className="h-4 w-4 text-orange-500" />
										<span className="text-sm">На собеседовании</span>
									</div>
									<Badge variant="default">{interviewingCandidates}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<UserCheckIcon className="h-4 w-4 text-green-500" />
										<span className="text-sm">Принято</span>
									</div>
									<Badge
										variant="default"
										className="bg-green-100 text-green-800"
									>
										{acceptedCandidates}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<UserXIcon className="h-4 w-4 text-red-500" />
										<span className="text-sm">Отклонено</span>
									</div>
									<Badge variant="destructive">{rejectedCandidates}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<ClockIcon className="h-4 w-4 text-gray-500" />
										<span className="text-sm">На удержании</span>
									</div>
									<Badge variant="outline">{onHoldCandidates}</Badge>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MessageSquareIcon className="h-5 w-5" />
									Результаты интервью
								</CardTitle>
								<CardDescription>Обратная связь по интервью</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<MessageSquareIcon className="h-4 w-4 text-orange-500" />
										<span className="text-sm">Активные</span>
									</div>
									<Badge variant="default">{activeInterviews}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<CheckCircleIcon className="h-4 w-4 text-green-500" />
										<span className="text-sm">Завершенные</span>
									</div>
									<Badge
										variant="default"
										className="bg-green-100 text-green-800"
									>
										{completedInterviews}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<CheckCircleIcon className="h-4 w-4 text-green-500" />
										<span className="text-sm">Положительные</span>
									</div>
									<Badge
										variant="default"
										className="bg-green-100 text-green-800"
									>
										{positiveFeedback}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<XCircleIcon className="h-4 w-4 text-red-500" />
										<span className="text-sm">Отрицательные</span>
									</div>
									<Badge variant="destructive">{negativeFeedback}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<ClockIcon className="h-4 w-4 text-blue-500" />
										<span className="text-sm">Всего</span>
									</div>
									<Badge variant="secondary">{totalInterviews}</Badge>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Описание и требования */}
					{(vacancy.description ||
						vacancy.requirements ||
						vacancy.benefits) && (
						<div className="grid gap-4 md:grid-cols-3">
							{vacancy.description && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Описание</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											{vacancy.description}
										</p>
									</CardContent>
								</Card>
							)}
							{vacancy.requirements && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Требования</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											{vacancy.requirements}
										</p>
									</CardContent>
								</Card>
							)}
							{vacancy.benefits && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Преимущества</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											{vacancy.benefits}
										</p>
									</CardContent>
								</Card>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
