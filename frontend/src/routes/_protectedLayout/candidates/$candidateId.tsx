import { createFileRoute, Link } from "@tanstack/react-router";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CandidateAvatar } from "@/components/candidates/candidate-avatar";
import { CandidateStatusBadge } from "@/components/candidates/status-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
	"/_protectedLayout/candidates/$candidateId",
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
				<Button asChild>
					<Link
						to="/candidates/$candidateId/edit"
						params={{ candidateId: params.candidateId }}
					>
						Редактировать
					</Link>
				</Button>
			</div>

			{/* Candidate information */}
			<div className="grid max-w-2xl gap-6 rounded-lg border p-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label className="text-sm font-medium text-muted-foreground">
							Email
						</label>
						<p className="text-sm">{c.email}</p>
					</div>
					<div>
						<label className="text-sm font-medium text-muted-foreground">
							Опыт работы
						</label>
						<p className="text-sm">{c.experience} лет</p>
					</div>
					<div>
						<label className="text-sm font-medium text-muted-foreground">
							Статус
						</label>
						<div className="mt-1">
							{c.status && <CandidateStatusBadge status={c.status} />}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
