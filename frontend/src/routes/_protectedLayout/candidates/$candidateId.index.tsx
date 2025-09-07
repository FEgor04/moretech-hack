import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CandidateAvatar } from "@/components/candidates/candidate-avatar";
import { CandidateStatusBadge } from "@/components/candidates/status-badge";
import { ScheduleInterviewDialog } from "@/components/interviews/schedule-interview-dialog";
import { InterviewsList } from "@/components/candidates/interviews-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkIcon, UserIcon } from "lucide-react";

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

	const c = candidate.data;

	return (
		<div className="space-y-6">
			{/* Header with candidate name and edit button */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<CandidateAvatar name={c.name} />
					<div>
						<h1 className="text-2xl font-semibold">{c.name}</h1>
						<p className="text-muted-foreground">{c.position}</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<a href={`/candidate/${params.candidateId}`} target="_blank" rel="noopener noreferrer">
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

			{/* Candidate information */}
			<div className="grid max-w-2xl gap-6 rounded-lg border p-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label>Email</Label>
						<p className="text-sm">{c.email || "Не указан"}</p>
					</div>
					<div>
						<Label>Опыт работы</Label>
						<p className="text-sm">{c.experience} лет</p>
					</div>
					<div>
						<Label>Статус</Label>
						<div className="mt-1">
							{c.status && <CandidateStatusBadge status={c.status} />}
						</div>
					</div>
					<div>
						<Label>ID кандидата</Label>
						<p className="text-sm font-mono text-xs bg-gray-100 px-2 py-1 rounded">
							{params.candidateId}
						</p>
					</div>
				</div>
			</div>

			{/* Candidate self-service info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserIcon className="h-5 w-5" />
						Самообслуживание кандидата
					</CardTitle>
					<CardDescription>
						Кандидат может самостоятельно обновлять свою информацию
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Поделитесь этой ссылкой с кандидатом, чтобы он мог самостоятельно обновлять свою информацию:
						</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded border">
								{typeof window !== 'undefined' ? `${window.location.origin}/candidate/${params.candidateId}` : `/candidate/${params.candidateId}`}
							</code>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									if (typeof window !== 'undefined') {
										navigator.clipboard.writeText(`${window.location.origin}/candidate/${params.candidateId}`);
									}
								}}
							>
								Копировать
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Interviews section */}
			<InterviewsList candidateId={params.candidateId} />
		</div>
	);
}
