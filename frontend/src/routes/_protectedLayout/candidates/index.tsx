import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCandidatesTable } from "@/components/candidates/table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { CreateFromCVButton } from "@/components/candidates/create-from-cv";
import { PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_protectedLayout/candidates/")({
	component: CandidatesPage,
	loader: async ({ context }) => {
		await context.queryClient.fetchQuery(candidatesQueryOptions());
		return null;
	},
});

function CandidatesPage() {
	const candidates = useSuspenseQuery(candidatesQueryOptions());

	const table = useCandidatesTable(candidates.data ?? []);

	return (
		<Suspense
			fallback={
				<div className="space-y-6">
					<header className="flex flex-row justify-between items-center">
						<div className="flex flex-col gap-2">
							<Skeleton className="h-7 w-40" />
							<Skeleton className="h-4 w-72" />
						</div>
						<div className="flex flex-row gap-2">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-48" />
						</div>
					</header>
					<main>
						<Skeleton className="h-96 w-full" />
					</main>
				</div>
			}
		>
		<div className="space-y-6">
			<header className="flex flex-row justify-between items-center">
				<div className="flex flex-col">
					<h1 className="text-2xl font-bold mb-2">Кандидаты</h1>
					<p className="text-muted-foreground">
						Управление кандидатами и отслеживание процесса найма
					</p>
				</div>
				<div className="flex flex-row gap-2">
					<Button variant="outline" asChild>
						<Link to="/candidates/new">
							<PlusIcon />
							Создать
						</Link>
					</Button>
					<CreateFromCVButton />
				</div>
			</header>
			<main>
				<DataTable table={table} />
			</main>
		</div>
		</Suspense>
	);
}
