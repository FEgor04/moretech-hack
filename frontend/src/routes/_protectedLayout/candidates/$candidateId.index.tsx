import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { interviewsByCandidateQueryOptions } from "@/api/queries/interviews";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CandidateAvatar } from "@/components/candidates/candidate-avatar";
import { CandidateStatusBadge } from "@/components/candidates/status-badge";
import { ScheduleInterviewDialog } from "@/components/interviews/schedule-interview-dialog";
import { InterviewsList } from "@/components/candidates/interviews-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ExternalLinkIcon,
	UserIcon,
	ArrowLeftIcon,
	MailIcon,
	BriefcaseIcon,
	ClockIcon,
	CalendarIcon,
	MessageSquareIcon,
	CheckCircleIcon,
	XCircleIcon,
	AlertCircleIcon,
	FileTextIcon,
	StarIcon,
	ActivityIcon,
} from "lucide-react";

export const Route = createFileRoute(
	"/_protectedLayout/candidates/$candidateId/",
)({
	component: CandidateDetail,
	loader: async ({ params, context }) => {
		const candidate = await context.queryClient.fetchQuery(
			candidateQueryOptions(params.candidateId),
		);
		return { candidate };
	},
});

function CandidateDetail() {
	const params = Route.useParams();
	const candidate = useSuspenseQuery(candidateQueryOptions(params.candidateId));
	const interviews = useSuspenseQuery(
		interviewsByCandidateQueryOptions(params.candidateId),
	);

	const c = candidate.data;
	const candidateInterviews = interviews.data;

	// Статистика по интервью
	const totalInterviews = candidateInterviews.length;
	const completedInterviews = candidateInterviews.filter(
		(i) => i.status === "завершено",
	).length;
	const activeInterviews = candidateInterviews.filter(
		(i) => i.status === "на собеседовании",
	).length;
	const positiveFeedback = candidateInterviews.filter(
		(i) => i.feedback_positive === true,
	).length;
	const negativeFeedback = candidateInterviews.filter(
		(i) => i.feedback_positive === false,
	).length;

	// Время в системе
	const daysInSystem = c.created_at
		? Math.floor(
				(Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24),
			)
		: 0;

	// Последнее обновление
	const lastUpdated = c.updated_at
		? Math.floor(
				(Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24),
			)
		: 0;

	return (
		<div className="space-y-6">
			{/* Header with candidate name and edit button */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" asChild>
						<Link to="/candidates">
							<ArrowLeftIcon className="h-4 w-4" />
							<span className="sr-only">Назад к кандидатам</span>
						</Link>
					</Button>
					<CandidateAvatar name={c.name} />
					<div>
						<h1 className="text-2xl font-semibold">{c.name}</h1>
						<p className="text-muted-foreground">{c.position}</p>
						<div className="flex items-center gap-2 mt-1">
							{c.status && <CandidateStatusBadge status={c.status} />}
							<Badge variant="outline" className="text-xs">
								В системе {daysInSystem} дн.
							</Badge>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<a
							href={`/candidate/${params.candidateId}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLinkIcon className="h-4 w-4 mr-2" />
							Страница кандидата
						</a>
					</Button>
					<ScheduleInterviewDialog currentCandidateId={params.candidateId}>
						<Button variant="outline">Запланировать интервью</Button>
					</ScheduleInterviewDialog>
					<Button asChild>
						<Link
							to="/candidates/$candidateId/edit"
							params={{ candidateId: params.candidateId }}
						>
							Редактировать
						</Link>
					</Button>
				</div>
			</div>

			{/* Основная информация и статистика */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Основная информация */}
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserIcon className="h-5 w-5" />
								Личная информация
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="flex items-center gap-3">
									<MailIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<Label className="text-xs text-muted-foreground">
											Email
										</Label>
										<p className="text-sm font-medium">
											{c.email || "Не указан"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<Label className="text-xs text-muted-foreground">
											Должность
										</Label>
										<p className="text-sm font-medium">{c.position}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<ClockIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<Label className="text-xs text-muted-foreground">
											Опыт работы
										</Label>
										<p className="text-sm font-medium">{c.experience} лет</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<CalendarIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<Label className="text-xs text-muted-foreground">
											Дата регистрации
										</Label>
										<p className="text-sm font-medium">
											{c.created_at
												? new Date(c.created_at).toLocaleDateString("ru-RU")
												: "Не указана"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<ActivityIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<Label className="text-xs text-muted-foreground">
											Последнее обновление
										</Label>
										<p className="text-sm font-medium">
											{lastUpdated === 0
												? "Сегодня"
												: `${lastUpdated} дн. назад`}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<FileTextIcon className="h-4 w-4 text-muted-foreground" />
									<div>
										<Label className="text-xs text-muted-foreground">
											ID кандидата
										</Label>
										<p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
											{params.candidateId}
										</p>
									</div>
								</div>
								{c.skills && (
									<div className="flex items-start gap-3 md:col-span-2">
										<StarIcon className="h-4 w-4 text-muted-foreground mt-1" />
										<div className="flex-1">
											<Label className="text-xs text-muted-foreground">
												Ключевые навыки
											</Label>
											<div className="flex flex-wrap gap-1 mt-1">
												{Array.isArray(c.skills) ? (
													c.skills.map((skill) => (
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
														{c.skills}
													</Badge>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Статистика интервью */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageSquareIcon className="h-5 w-5" />
								Статистика интервью
							</CardTitle>
							<CardDescription>
								Информация о проведенных интервью
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
								<div className="text-center">
									<div className="text-2xl font-bold">{totalInterviews}</div>
									<p className="text-xs text-muted-foreground">Всего интервью</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold">{activeInterviews}</div>
									<p className="text-xs text-muted-foreground">Активных</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold">{completedInterviews}</div>
									<p className="text-xs text-muted-foreground">Завершенных</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold">
										{totalInterviews > 0
											? Math.round(
													(completedInterviews / totalInterviews) * 100,
												)
											: 0}
										%
									</div>
									<p className="text-xs text-muted-foreground">Завершено</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Обратная связь */}
					{totalInterviews > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<StarIcon className="h-5 w-5" />
									Обратная связь
								</CardTitle>
								<CardDescription>Результаты интервью</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div className="flex items-center gap-3">
										<CheckCircleIcon className="h-5 w-5 text-green-500" />
										<div>
											<div className="text-lg font-semibold">{positiveFeedback}</div>
											<p className="text-xs text-muted-foreground">Положительных</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<XCircleIcon className="h-5 w-5 text-red-500" />
										<div>
											<div className="text-lg font-semibold">{negativeFeedback}</div>
											<p className="text-xs text-muted-foreground">Отрицательных</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<AlertCircleIcon className="h-5 w-5 text-gray-500" />
										<div>
											<div className="text-lg font-semibold">
												{completedInterviews - positiveFeedback - negativeFeedback}
											</div>
											<p className="text-xs text-muted-foreground">Без оценки</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Боковая панель */}
				<div className="space-y-6">
					{/* Быстрые действия */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Быстрые действия</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<ScheduleInterviewDialog currentCandidateId={params.candidateId}>
								<Button className="w-full justify-start" variant="outline">
									<CalendarIcon className="h-4 w-4 mr-2" />
									Запланировать интервью
								</Button>
							</ScheduleInterviewDialog>
							<Button
								asChild
								className="w-full justify-start"
								variant="outline"
							>
								<Link
									to="/candidates/$candidateId/edit"
									params={{ candidateId: params.candidateId }}
								>
									<UserIcon className="h-4 w-4 mr-2" />
									Редактировать профиль
								</Link>
							</Button>
							<Button
								asChild
								className="w-full justify-start"
								variant="outline"
							>
								<a
									href={`/candidate/${params.candidateId}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLinkIcon className="h-4 w-4 mr-2" />
									Открыть страницу кандидата
								</a>
							</Button>
						</CardContent>
					</Card>

					{/* Самообслуживание */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserIcon className="h-5 w-5" />
								Самообслуживание
							</CardTitle>
							<CardDescription>Ссылка для кандидата</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Поделитесь этой ссылкой с кандидатом:
								</p>
								<div className="flex items-center gap-2">
									<code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded border break-all">
										{typeof window !== "undefined"
											? `${window.location.origin}/candidate/${params.candidateId}`
											: `/candidate/${params.candidateId}`}
									</code>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											if (typeof window !== "undefined") {
												navigator.clipboard.writeText(
													`${window.location.origin}/candidate/${params.candidateId}`,
												);
											}
										}}
									>
										Копировать
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Дополнительная информация */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Дополнительно</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">В системе</span>
								<Badge variant="outline">{daysInSystem} дней</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Статус</span>
								{c.status && <CandidateStatusBadge status={c.status} />}
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Опыт</span>
								<Badge variant="secondary">{c.experience} лет</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Список интервью */}
			<InterviewsList candidateId={params.candidateId} />
		</div>
	);
}
