import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { vacanciesQueryOptions } from "@/api/queries/vacancies";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import { interviewsQueryOptions } from "@/api/queries/interviews";
import type { VacancyRead, ExperienceItem } from "@/api/client/types.gen";

// Расширенный тип для вакансии с дополнительными полями
type ExtendedVacancy = VacancyRead & {
	company?: string | null;
	experience_level?: string | null;
	benefits?: string | null;
};
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
	BriefcaseBusinessIcon,
	UsersIcon,
	MessageSquareIcon,
	CheckCircleIcon,
	TrendingUpIcon,
	ClockIcon,
	DollarSignIcon,
	MapPinIcon,
	BuildingIcon,
	CalendarIcon,
	UserCheckIcon,
	UserXIcon,
	AlertCircleIcon,
} from "lucide-react";

export const Route = createFileRoute("/_protectedLayout/dashboard")({
	component: Dashboard,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.fetchQuery(vacanciesQueryOptions()),
			context.queryClient.fetchQuery(candidatesQueryOptions()),
			context.queryClient.fetchQuery(interviewsQueryOptions()),
		]);
		return null;
	},
});

function Dashboard() {
	const metricSkeletonKeys = ["m1", "m2", "m3", "m4"] as const;
	const statSkeletonKeys = ["s1", "s2", "s3", "s4"] as const;
	const detailSkeletonKeys = ["d1", "d2", "d3"] as const;
	const detailRowSkeletonKeys = ["r1", "r2", "r3", "r4"] as const;
	const { data: vacancies } = useSuspenseQuery(vacanciesQueryOptions()) as {
		data: ExtendedVacancy[];
	};
	const { data: candidates } = useSuspenseQuery(candidatesQueryOptions());
	const { data: interviews } = useSuspenseQuery(interviewsQueryOptions());

	// Подсчет статистики вакансий
	const totalVacancies = vacancies.length;
	const openVacancies = vacancies.filter((v) => v.status === "open").length;
	const closedVacancies = vacancies.filter((v) => v.status === "closed").length;

	// Подсчет статистики кандидатов
	const totalCandidates = candidates.length;
	const pendingCandidates = candidates.filter(
		(c) => c.status === "pending",
	).length;
	const reviewingCandidates = candidates.filter(
		(c) => c.status === "reviewing",
	).length;
	const interviewingCandidates = candidates.filter(
		(c) => c.status === "interviewing",
	).length;
	const acceptedCandidates = candidates.filter(
		(c) => c.status === "accepted",
	).length;
	const rejectedCandidates = candidates.filter(
		(c) => c.status === "rejected",
	).length;
	const onHoldCandidates = candidates.filter(
		(c) => c.status === "on_hold",
	).length;

	// Подсчет статистики интервью
	const totalInterviews = interviews.length;
	const completedInterviews = interviews.filter(
		(i) => i.state === "done",
	).length;
	const activeInterviews = interviews.filter(
		(i) => i.state === "in_progress",
	).length;

	// Статистика по зарплатам
	const vacanciesWithSalary = vacancies.filter(
		(v) => v.salary_min && v.salary_max,
	);
	const avgSalaryMin =
		vacanciesWithSalary.length > 0
			? Math.round(
					vacanciesWithSalary.reduce((sum, v) => sum + (v.salary_min || 0), 0) /
						vacanciesWithSalary.length,
				)
			: 0;
	const avgSalaryMax =
		vacanciesWithSalary.length > 0
			? Math.round(
					vacanciesWithSalary.reduce((sum, v) => sum + (v.salary_max || 0), 0) /
						vacanciesWithSalary.length,
				)
			: 0;

	// Статистика по опыту кандидатов
	const avgExperience =
		candidates.length > 0
			? Math.round(
					(candidates.reduce((sum, c) => {
						// Calculate total years from experience array
						if (c.experience && Array.isArray(c.experience)) {
							const totalYears = c.experience.reduce(
								(expSum: number, exp: ExperienceItem) => {
									return expSum + (exp.years || 0);
								},
								0,
							);
							return sum + totalYears;
						}
						return sum;
					}, 0) /
						candidates.length) *
						10,
				) / 10
			: 0;

	// Статистика по компаниям
	const uniqueCompanies = new Set(
		vacancies.map((v) => v.company).filter(Boolean),
	).size;

	// Статистика по местоположениям
	const uniqueLocations = new Set(
		vacancies.map((v) => v.location).filter(Boolean),
	).size;

	// Конверсия (принятые / общее количество кандидатов)
	const conversionRate =
		totalCandidates > 0
			? Math.round((acceptedCandidates / totalCandidates) * 100)
			: 0;

	return (
		<Suspense
			fallback={
				<div className="space-y-6">
					<header className="flex flex-row justify-between items-center">
						<div className="flex flex-col gap-2">
							<Skeleton className="h-6 w-40" />
							<Skeleton className="h-4 w-64" />
						</div>
					</header>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{metricSkeletonKeys.map((key) => (
							<Card key={key}>
								<CardHeader className="pb-2">
									<Skeleton className="h-4 w-24" />
								</CardHeader>
								<CardContent className="space-y-2">
									<Skeleton className="h-6 w-12" />
									<Skeleton className="h-3 w-28" />
								</CardContent>
							</Card>
						))}
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{statSkeletonKeys.map((key) => (
							<Card key={key}>
								<CardHeader className="pb-2">
									<Skeleton className="h-4 w-28" />
								</CardHeader>
								<CardContent className="space-y-2">
									<Skeleton className="h-6 w-20" />
									<Skeleton className="h-3 w-36" />
								</CardContent>
							</Card>
						))}
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{detailSkeletonKeys.map((detailKey) => (
							<Card key={detailKey}>
								<CardHeader>
									<Skeleton className="h-5 w-48" />
									<Skeleton className="h-3 w-40 mt-2" />
								</CardHeader>
								<CardContent className="space-y-3">
									{detailRowSkeletonKeys.map((rowKey) => (
										<div
											key={`${detailKey}-${rowKey}`}
											className="flex items-center justify-between"
										>
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-5 w-10" />
										</div>
									))}
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			}
		>
			<div className="space-y-6">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col">
						<h1 className="text-2xl font-bold mb-2">Дашборд</h1>
						<p className="text-muted-foreground">
							Обзор вакансий, кандидатов и интервью
						</p>
					</div>
				</header>
				<main className="space-y-6">
					{/* Основные метрики */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Всего вакансий
								</CardTitle>
								<BriefcaseBusinessIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalVacancies}</div>
								<p className="text-xs text-muted-foreground">
									{openVacancies} открытых, {closedVacancies} закрытых
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Всего кандидатов
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
					</div>

					{/* Дополнительная статистика */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Средняя зарплата
								</CardTitle>
								<DollarSignIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{avgSalaryMin > 0
										? `${Math.round(avgSalaryMin / 1000)}k - ${Math.round(avgSalaryMax / 1000)}k`
										: "—"}
								</div>
								<p className="text-xs text-muted-foreground">
									{vacanciesWithSalary.length} вакансий с зарплатой
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Средний опыт
								</CardTitle>
								<ClockIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{avgExperience} лет</div>
								<p className="text-xs text-muted-foreground">
									Среди всех кандидатов
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Компании</CardTitle>
								<BuildingIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{uniqueCompanies}</div>
								<p className="text-xs text-muted-foreground">
									Уникальных компаний
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Локации</CardTitle>
								<MapPinIcon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{uniqueLocations}</div>
								<p className="text-xs text-muted-foreground">
									Уникальных локаций
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Детальная статистика */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<UsersIcon className="h-5 w-5" />
									Статусы кандидатов
								</CardTitle>
								<CardDescription>
									Распределение кандидатов по статусам
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
									<Badge variant="secondary">{reviewingCandidates}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<MessageSquareIcon className="h-4 w-4 text-orange-500" />
										<span className="text-sm">На собеседовании</span>
									</div>
									<Badge variant="secondary">{interviewingCandidates}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<UserCheckIcon className="h-4 w-4 text-green-500" />
										<span className="text-sm">Принято</span>
									</div>
									<Badge variant="secondary">{acceptedCandidates}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<UserXIcon className="h-4 w-4 text-red-500" />
										<span className="text-sm">Отклонено</span>
									</div>
									<Badge variant="secondary">{rejectedCandidates}</Badge>
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
									<BriefcaseBusinessIcon className="h-5 w-5" />
									Статусы вакансий
								</CardTitle>
								<CardDescription>
									Распределение вакансий по статусам
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<CheckCircleIcon className="h-4 w-4 text-green-500" />
										<span className="text-sm">Открытые</span>
									</div>
									<Badge variant="secondary">{openVacancies}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<AlertCircleIcon className="h-4 w-4 text-gray-500" />
										<span className="text-sm">Закрытые</span>
									</div>
									<Badge variant="secondary">{closedVacancies}</Badge>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CalendarIcon className="h-5 w-5" />
									Интервью
								</CardTitle>
								<CardDescription>Статистика по интервью</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<MessageSquareIcon className="h-4 w-4 text-orange-500" />
										<span className="text-sm">Активные</span>
									</div>
									<Badge variant="secondary">{activeInterviews}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<CheckCircleIcon className="h-4 w-4 text-green-500" />
										<span className="text-sm">Завершенные</span>
									</div>
									<Badge variant="secondary">{completedInterviews}</Badge>
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
				</main>
			</div>
		</Suspense>
	);
}
