import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { vacanciesQueryOptions } from "@/api/queries/vacancies";
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
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
});

function Dashboard() {
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
		(i) => i.status === "завершено",
	).length;
	const activeInterviews = interviews.filter(
		(i) => i.status === "на собеседовании",
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
					(candidates.reduce((sum, c) => sum + (c.experience_years ?? 0), 0) /
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
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
				<p className="text-muted-foreground">
					Обзор вакансий, кандидатов и интервью
				</p>
			</div>

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
						<CardTitle className="text-sm font-medium">Средний опыт</CardTitle>
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
						<p className="text-xs text-muted-foreground">Уникальных компаний</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Локации</CardTitle>
						<MapPinIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{uniqueLocations}</div>
						<p className="text-xs text-muted-foreground">Уникальных локаций</p>
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
		</div>
	);
}
