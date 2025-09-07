import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import { interviewsQueryOptions } from "@/api/queries/interviews";
import {
\tCard,
\tCardContent,
\tCardDescription,
\tCardHeader,
\tCardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
\tBarChart3Icon,
\tUsersIcon,
\tMessageSquareIcon,
\tCheckCircleIcon,
\tXCircleIcon,
\tClockIcon,
\tTrendingUpIcon,
\tDollarSignIcon,
\tMapPinIcon,
\tBuildingIcon,
\tCalendarIcon,
\tArrowLeftIcon,
\tUserCheckIcon,
\tUserXIcon,
\tAlertCircleIcon,
} from "lucide-react";

export const Route = createFileRoute(
\t"/_protectedLayout/vacancies/$vacancyId/",
)({
\tcomponent: VacancyStatsPage,
\tloader: async ({ params, context }) => {
\t\tawait Promise.all([
\t\t\tcontext.queryClient.fetchQuery(
\t\t\t\tvacancyQueryOptions(Number(params.vacancyId)),
\t\t\t),
\t\t\tcontext.queryClient.fetchQuery(candidatesQueryOptions()),
\t\t\tcontext.queryClient.fetchQuery(interviewsQueryOptions()),
\t\t]);
\t\treturn null;
\t},
});

function VacancyStatsPage() {
\tconst params = Route.useParams();
\tconst { data: vacancy } = useSuspenseQuery(
\t\tvacancyQueryOptions(Number(params.vacancyId)),
\t);
\tconst { data: candidates } = useSuspenseQuery(candidatesQueryOptions());
\tconst { data: interviews } = useSuspenseQuery(interviewsQueryOptions());

\tconst relevantCandidates = candidates.filter((candidate) => {
\t\tconst experienceMatch =
\t\t\tvacancy.experience_level === "junior"
\t\t\t\t? candidate.experience <= 2
\t\t\t\t: vacancy.experience_level === "middle"
\t\t\t\t? candidate.experience >= 2 && candidate.experience <= 5
\t\t\t\t: vacancy.experience_level === "senior"
\t\t\t\t? candidate.experience >= 5 && candidate.experience <= 8
\t\t\t\t: vacancy.experience_level === "lead"
\t\t\t\t? candidate.experience >= 8
\t\t\t\t: true;
\t\tconst positionMatch =
\t\t\tcandidate.position
\t\t\t\t.toLowerCase()
\t\t\t\t.includes(vacancy.title.toLowerCase()) ||
\t\t\tvacancy.title
\t\t\t\t.toLowerCase()
\t\t\t\t.includes(candidate.position.toLowerCase());
\t\treturn experienceMatch || positionMatch;
\t});

\tconst vacancyInterviews = interviews.filter(
\t\t(interview) => interview.vacancy_id === vacancy.id,
\t);

\tconst totalCandidates = relevantCandidates.length;
\tconst pendingCandidates = relevantCandidates.filter(
\t\t(c) => c.status === "pending",
\t).length;
\tconst reviewingCandidates = relevantCandidates.filter(
\t\t(c) => c.status === "reviewing",
\t).length;
\tconst interviewingCandidates = relevantCandidates.filter(
\t\t(c) => c.status === "interviewing",
\t).length;
\tconst acceptedCandidates = relevantCandidates.filter(
\t\t(c) => c.status === "accepted",
\t).length;
\tconst rejectedCandidates = relevantCandidates.filter(
\t\t(c) => c.status === "rejected",
\t).length;
\tconst onHoldCandidates = relevantCandidates.filter(
\t\t(c) => c.status === "on_hold",
\t).length;

\tconst totalInterviews = vacancyInterviews.length;
\tconst completedInterviews = vacancyInterviews.filter(
\t\t(i) => i.status === "завершено",
\t).length;
\tconst activeInterviews = vacancyInterviews.filter(
\t\t(i) => i.status === "на собеседовании",
\t).length;
\tconst positiveFeedback = vacancyInterviews.filter(
\t\t(i) => i.feedback_positive === true,
\t).length;
\tconst negativeFeedback = vacancyInterviews.filter(
\t\t(i) => i.feedback_positive === false,
\t).length;

\tconst conversionRate =
\t\ttotalCandidates > 0
\t\t\t? Math.round((acceptedCandidates / totalCandidates) * 100)
\t\t\t: 0;

\tconst daysOpen = vacancy.created_at
\t\t? Math.floor(
\t\t\t\t(Date.now() - new Date(vacancy.created_at).getTime()) /
\t\t\t\t\t(1000 * 60 * 60 * 24),
\t\t\t)
\t\t: 0;

\treturn (
\t\t<div className="space-y-6">
\t\t\t<header className="flex items-center justify-between">
\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t<Button variant="outline" asChild>
\t\t\t\t\t\t<Link to="/vacancies">
\t\t\t\t\t\t\t<ArrowLeftIcon className="h-4 w-4 mr-2" />
\t\t\t\t\t\t\tНазад к вакансиям
\t\t\t\t\t\t</Link>
\t\t\t\t\t</Button>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h1 className="text-2xl font-bold flex items-center gap-2">
\t\t\t\t\t\t\t<BarChart3Icon className="w-5 h-5" />
\t\t\t\t\t\t\tСтатистика: {vacancy.title}
\t\t\t\t\t\t</h1>
\t\t\t\t\t\t<p className="text-muted-foreground">Детальная аналитика по вакансии</p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<Button variant="outline" asChild>
\t\t\t\t\t<Link to="/vacancies/$vacancyId/edit" params={{ vacancyId: params.vacancyId }}>
\t\t\t\t\t\tРедактировать
\t\t\t\t\t</Link>
\t\t\t\t</Button>
\t\t\t</header>

\t\t\t{/* Информация о вакансии */}
\t\t\t<Card>
\t\t\t\t<CardHeader>
\t\t\t\t\t<CardTitle className="flex items-center gap-2">
\t\t\t\t\t\t<BuildingIcon className="h-5 w-5" />
\t\t\t\t\t\tИнформация о вакансии
\t\t\t\t\t</CardTitle>
\t\t\t\t</CardHeader>
\t\t\t\t<CardContent>
\t\t\t\t\t<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t<BuildingIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<p className="text-xs text-muted-foreground">Компания</p>
\t\t\t\t\t\t\t\t<p className="text-sm font-medium">{vacancy.company || "Не указана"}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t<MapPinIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<p className="text-xs text-muted-foreground">Локация</p>
\t\t\t\t\t\t\t\t<p className="text-sm font-medium">{vacancy.location || "Не указана"}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t<DollarSignIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<p className="text-xs text-muted-foreground">Зарплата</p>
\t\t\t\t\t\t\t\t<p className="text-sm font-medium">
\t\t\t\t\t\t\t\t\t{vacancy.salary_min && vacancy.salary_max
\t\t\t\t\t\t\t\t\t\t? `${Math.round(vacancy.salary_min / 1000)}k - ${Math.round(vacancy.salary_max / 1000)}k ₽`
\t\t\t\t\t\t\t\t\t\t: "Не указана"}
\t\t\t\t\t\t\t\t</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t<ClockIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<p className="text-xs text-muted-foreground">Тип занятости</p>
\t\t\t\t\t\t\t\t<p className="text-sm font-medium">{vacancy.employment_type || "Не указан"}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<p className="text-xs text-muted-foreground">Уровень</p>
\t\t\t\t\t\t\t\t<p className="text-sm font-medium">{vacancy.experience_level || "Не указан"}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t<CalendarIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<p className="text-xs text-muted-foreground">Открыта</p>
\t\t\t\t\t\t\t\t<p className="text-sm font-medium">{daysOpen} дней</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</CardContent>
\t\t\t</Card>

\t\t\t{/* Основные метрики */}
\t\t\t<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
\t\t\t\t<Card>
\t\t\t\t\t<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
\t\t\t\t\t\t<CardTitle className="text-sm font-medium">Подходящие кандидаты</CardTitle>
\t\t\t\t\t\t<UsersIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t</CardHeader>
\t\t\t\t\t<CardContent>
\t\t\t\t\t\t<div className="text-2xl font-bold">{totalCandidates}</div>
\t\t\t\t\t\t<p className="text-xs text-muted-foreground">{pendingCandidates} на рассмотрении</p>
\t\t\t\t\t</CardContent>
\t\t\t\t</Card>
\t\t\t\t<Card>
\t\t\t\t\t<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
\t\t\t\t\t\t<CardTitle className="text-sm font-medium">Интервью</CardTitle>
\t\t\t\t\t\t<MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t</CardHeader>
\t\t\t\t\t<CardContent>
\t\t\t\t\t\t<div className="text-2xl font-bold">{totalInterviews}</div>
\t\t\t\t\t\t<p className="text-xs text-muted-foreground">{activeInterviews} активных</p>
\t\t\t\t\t</CardContent>
\t\t\t\t</Card>
\t\t\t\t<Card>
\t\t\t\t\t<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
\t\t\t\t\t\t<CardTitle className="text-sm font-medium">Конверсия</CardTitle>
\t\t\t\t\t\t<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t</CardHeader>
\t\t\t\t\t<CardContent>
\t\t\t\t\t\t<div className="text-2xl font-bold">{conversionRate}%</div>
\t\t\t\t\t\t<p className="text-xs text-muted-foreground">{acceptedCandidates} принято</p>
\t\t\t\t\t</CardContent>
\t\t\t\t</Card>
\t\t\t\t<Card>
\t\t\t\t\t<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
\t\t\t\t\t\t<CardTitle className="text-sm font-medium">Статус</CardTitle>
\t\t\t\t\t\t<CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t</CardHeader>
\t\t\t\t\t<CardContent>
\t\t\t\t\t\t<div className="text-2xl font-bold">
\t\t\t\t\t\t\t<Badge variant={vacancy.status === "open" ? "secondary" : "secondary"}>
\t\t\t\t\t\t\t\t{vacancy.status === "open" ? "Открыта" : "Закрыта"}
\t\t\t\t\t\t\t</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<p className="text-xs text-muted-foreground">{daysOpen} дней в работе</p>
\t\t\t\t\t</CardContent>
\t\t\t\t</Card>
\t\t\t</div>

\t\t\t{/* Детальная статистика */}
\t\t\t<div className="grid gap-4 md:grid-cols-2">
\t\t\t\t<Card>
\t\t\t\t\t<CardHeader>
\t\t\t\t\t\t<CardTitle className="flex items-center gap-2">
\t\t\t\t\t\t\t<UsersIcon className="h-5 w-5" />
\t\t\t\t\t\t\tСтатусы кандидатов
\t\t\t\t\t\t</CardTitle>
\t\t\t\t\t\t<CardDescription>Распределение подходящих кандидатов</CardDescription>
\t\t\t\t\t</CardHeader>
\t\t\t\t\t<CardContent className="space-y-3">
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<AlertCircleIcon className="h-4 w-4 text-yellow-500" />
\t\t\t\t\t\t\t\t<span className="text-sm">На рассмотрении</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{pendingCandidates}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<ClockIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">На рассмотрении</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{reviewingCandidates}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">На собеседовании</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{interviewingCandidates}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<UserCheckIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">Принято</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{acceptedCandidates}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<UserXIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">Отклонено</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{rejectedCandidates}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<ClockIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">На удержании</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="outline">{onHoldCandidates}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t</CardContent>
\t\t\t\t</Card>

\t\t\t\t<Card>
\t\t\t\t\t<CardHeader>
\t\t\t\t\t\t<CardTitle className="flex items-center gap-2">
\t\t\t\t\t\t\t<MessageSquareIcon className="h-5 w-5" />
\t\t\t\t\t\t\tРезультаты интервью
\t\t\t\t\t\t</CardTitle>
\t\t\t\t\t\t<CardDescription>Обратная связь по интервью</CardDescription>
\t\t\t\t\t</CardHeader>
\t\t\t\t\t<CardContent className="space-y-3">
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">Активные</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{activeInterviews}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">Завершенные</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{completedInterviews}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">Положительные</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{positiveFeedback}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<XCircleIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">Отрицательные</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{negativeFeedback}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t<ClockIcon className="h-4 w-4 text-muted-foreground" />
\t\t\t\t\t\t\t\t<span className="text-sm">Всего</span>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<Badge variant="secondary">{totalInterviews}</Badge>
\t\t\t\t\t\t</div>
\t\t\t\t\t</CardContent>
\t\t\t\t</Card>
\t\t\t</div>
\t\t</div>
\t);
}


