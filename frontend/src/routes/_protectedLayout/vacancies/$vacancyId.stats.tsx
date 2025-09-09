import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import { interviewsQueryOptions } from "@/api/queries/interviews";
import type { VacancyRead, ExperienceItem } from "@/api/client/types.gen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ArrowLeftIcon,
	BarChart3Icon,
	BuildingIcon,
	MapPinIcon,
	DollarSignIcon,
	ClockIcon,
	UsersIcon,
	MessageSquareIcon,
	CheckCircleIcon,
	XCircleIcon,
	TrendingUpIcon,
	UserCheckIcon,
	UserXIcon,
	AlertCircleIcon,
	CalendarIcon,
} from "lucide-react";

// Расширенный тип для вакансии с дополнительными полями
type ExtendedVacancy = VacancyRead & {
	company?: string | null;
	experience_level?: string | null;
	benefits?: string | null;
};

export const Route = createFileRoute(
	"/_protectedLayout/vacancies/$vacancyId/stats",
)({
	component: VacancyStatsPage,
	loader: async ({ params, context }) => {
		await Promise.all([
			context.queryClient.fetchQuery(
				vacancyQueryOptions(Number(params.vacancyId)),
			),
			context.queryClient.fetchQuery(candidatesQueryOptions()),
			context.queryClient.fetchQuery(interviewsQueryOptions()),
		]);
		return null;
	},
});

function VacancyStatsPage() {
	const params = Route.useParams();
	const { data: vacancy } = useSuspenseQuery(
		vacancyQueryOptions(Number(params.vacancyId)),
	);
	const { data: candidates } = useSuspenseQuery(candidatesQueryOptions());
	const { data: interviews } = useSuspenseQuery(interviewsQueryOptions());

	const v = vacancy as ExtendedVacancy;

	// Подходящие кандидаты (простая эвристика)
	const relevantCandidates = candidates.filter((candidate) => {
		const candidateTotalYears =
			candidate.experience && Array.isArray(candidate.experience)
				? candidate.experience.reduce(
						(sum: number, exp: ExperienceItem) => sum + (exp.years || 0),
						0,
					)
				: 0;

		const experienceMatch =
			v.experience_level === "младший"
				? candidateTotalYears <= 2
				: v.experience_level === "средний"
					? candidateTotalYears >= 2 && candidateTotalYears <= 5
					: v.experience_level === "старший"
						? candidateTotalYears >= 5 && candidateTotalYears <= 8
						: v.experience_level === "ведущий"
							? candidateTotalYears >= 8
							: true;

		const positionMatch =
			candidate.position.toLowerCase().includes(v.title.toLowerCase()) ||
			v.title.toLowerCase().includes(candidate.position.toLowerCase());

		return experienceMatch || positionMatch;
	});

	const vacancyInterviews = interviews.filter((i) => i.vacancy_id === v.id);

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

	const totalInterviews = vacancyInterviews.length;
	const completedInterviews = vacancyInterviews.filter(
		(i) => i.state === "done",
	).length;
	const activeInterviews = vacancyInterviews.filter(
		(i) => i.state === "in_progress",
	).length;
	const positiveFeedback = vacancyInterviews.filter(
		(i) => i.feedback_positive === true,
	).length;
	const negativeFeedback = vacancyInterviews.filter(
		(i) => i.feedback_positive === false,
	).length;

	const conversionRate =
		totalCandidates > 0
			? Math.round((acceptedCandidates / totalCandidates) * 100)
			: 0;

	const daysOpen = v.created_at
		? Math.floor(
				(Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24),
			)
		: 0;

	return (
		<div>
			<div className="bg-white border-b">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button variant="outline" size="sm" asChild>
								<Link
									to="/vacancies/$vacancyId"
									params={{ vacancyId: params.vacancyId }}
								>
									<ArrowLeftIcon className="w-4 h-4" />
									<span className="sr-only">Назад к вакансии</span>
								</Link>
							</Button>
							<div>
								<h1 className="text-2xl font-bold flex items-center gap-2">
									<BarChart3Icon className="h-5 w-5" />
									Статистика: {v.title}
								</h1>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant={v.status === "open" ? "default" : "secondary"}
										className={
											v.status === "open"
												? "bg-green-100 text-green-800 border-green-200"
												: "bg-red-100 text-red-800 border-red-200"
										}
									>
										{v.status === "open" ? "🟢 Открыта" : "🔴 Закрыта"}
									</Badge>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto p-6 space-y-6">
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
										{v.company || "Не указана"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<MapPinIcon className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">Локация</p>
									<p className="text-sm font-medium">
										{v.location || "Не указана"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<DollarSignIcon className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">Зарплата</p>
									<p className="text-sm font-medium">
										{v.salary_min && v.salary_max
											? `${Math.round((v.salary_min as number) / 1000)}k - ${Math.round((v.salary_max as number) / 1000)}k ₽`
											: "Не указана"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<ClockIcon className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">Тип занятости</p>
									<p className="text-sm font-medium">
										{v.employment_type || "Не указан"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">Уровень</p>
									<p className="text-sm font-medium">
										{v.experience_level || "Не указан"}
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
								{pendingCandidates} на рассмотрении
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
								{activeInterviews} активных
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
								{acceptedCandidates} принято
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
									variant={v.status === "open" ? "default" : "secondary"}
									className={
										v.status === "open"
											? "bg-green-100 text-green-800 border-green-200 text-lg px-3 py-1"
											: "bg-red-100 text-red-800 border-red-200 text-lg px-3 py-1"
									}
								>
									{v.status === "open" ? "🟢 Открыта" : "🔴 Закрыта"}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground">
								{daysOpen} дней в работе
							</p>
						</CardContent>
					</Card>
				</div>

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
								<span className="text-sm">{pendingCandidates}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<ClockIcon className="h-4 w-4 text-blue-500" />
									<span className="text-sm">На рассмотрении</span>
								</div>
								<span className="text-sm">{reviewingCandidates}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<MessageSquareIcon className="h-4 w-4 text-orange-500" />
									<span className="text-sm">На собеседовании</span>
								</div>
								<span className="text-sm">{interviewingCandidates}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<UserCheckIcon className="h-4 w-4 text-green-500" />
									<span className="text-sm">Принято</span>
								</div>
								<span className="text-sm">{acceptedCandidates}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<UserXIcon className="h-4 w-4 text-red-500" />
									<span className="text-sm">Отклонено</span>
								</div>
								<span className="text-sm">{rejectedCandidates}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<ClockIcon className="h-4 w-4 text-gray-500" />
									<span className="text-sm">На удержании</span>
								</div>
								<span className="text-sm">{onHoldCandidates}</span>
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
								<span className="text-sm">{activeInterviews}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<CheckCircleIcon className="h-4 w-4 text-green-500" />
									<span className="text-sm">Завершенные</span>
								</div>
								<span className="text-sm">{completedInterviews}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<CheckCircleIcon className="h-4 w-4 text-green-500" />
									<span className="text-sm">Положительные</span>
								</div>
								<span className="text-sm">{positiveFeedback}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<XCircleIcon className="h-4 w-4 text-red-500" />
									<span className="text-sm">Отрицательные</span>
								</div>
								<span className="text-sm">{negativeFeedback}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<ClockIcon className="h-4 w-4 text-blue-500" />
									<span className="text-sm">Всего</span>
								</div>
								<span className="text-sm">{totalInterviews}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
