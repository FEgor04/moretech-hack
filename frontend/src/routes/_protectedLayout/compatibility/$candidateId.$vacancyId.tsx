import { createFileRoute, Link } from "@tanstack/react-router";
import { CompatibilityReport } from "@/components/compatibility/compatibility-report";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export const Route = createFileRoute(
	"/_protectedLayout/compatibility/$candidateId/$vacancyId",
)({
	component: CompatibilityAnalysisPage,
});

function CompatibilityAnalysisPage() {
	const params = Route.useParams();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" asChild>
					<Link to="/candidates">
						<ArrowLeftIcon className="h-4 w-4" />
						<span className="sr-only">Back to candidates</span>
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold">Compatibility Analysis</h1>
					<p className="text-muted-foreground">
						Detailed compatibility report between candidate and vacancy
					</p>
				</div>
			</div>

			{/* Compatibility Report */}
			<CompatibilityReport
				candidateId={params.candidateId}
				vacancyId={Number.parseInt(params.vacancyId)}
			/>
		</div>
	);
}
