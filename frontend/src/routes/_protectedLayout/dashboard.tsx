import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { vacanciesQueryOptions } from "@/api/queries/vacancies";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusinessIcon, UsersIcon, MessageSquareIcon, CheckCircleIcon } from "lucide-react";

export const Route = createFileRoute("/_protectedLayout/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { data: vacancies } = useSuspenseQuery(vacanciesQueryOptions());
	const { data: candidates } = useSuspenseQuery(candidatesQueryOptions());

	// Подсчет статистики
	const totalVacancies = vacancies.length;
	const openVacancies = vacancies.filter(v => v.status === "open").length;
	const closedVacancies = vacancies.filter(v => v.status === "closed").length;

	const totalCandidates = candidates.length;
	const pendingCandidates = candidates.filter(c => c.status === "pending").length;
	const interviewingCandidates = candidates.filter(c => c.status === "interviewing").length;
	const acceptedCandidates = candidates.filter(c => c.status === "accepted").length;
	const rejectedCandidates = candidates.filter(c => c.status === "rejected").length;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
				<p className="text-muted-foreground">
					Обзор вакансий, кандидатов и интервью
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Всего вакансий</CardTitle>
						<BriefcaseBusinessIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalVacancies}</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">{openVacancies}</span> открытых,{" "}
							<span className="text-gray-600">{closedVacancies}</span> закрытых
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Всего кандидатов</CardTitle>
						<UsersIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalCandidates}</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-blue-600">{pendingCandidates}</span> на рассмотрении
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">На собеседовании</CardTitle>
						<MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{interviewingCandidates}</div>
						<p className="text-xs text-muted-foreground">
							Активные интервью
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Принято</CardTitle>
						<CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{acceptedCandidates}</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-red-600">{rejectedCandidates}</span> отклонено
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Статусы кандидатов</CardTitle>
						<CardDescription>
							Распределение кандидатов по статусам
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm">На рассмотрении</span>
							<Badge variant="secondary">{pendingCandidates}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">На собеседовании</span>
							<Badge variant="default">{interviewingCandidates}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Принято</span>
							<Badge variant="default" className="bg-green-100 text-green-800">{acceptedCandidates}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Отклонено</span>
							<Badge variant="destructive">{rejectedCandidates}</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Статусы вакансий</CardTitle>
						<CardDescription>
							Распределение вакансий по статусам
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm">Открытые</span>
							<Badge variant="default" className="bg-green-100 text-green-800">{openVacancies}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm">Закрытые</span>
							<Badge variant="secondary">{closedVacancies}</Badge>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
