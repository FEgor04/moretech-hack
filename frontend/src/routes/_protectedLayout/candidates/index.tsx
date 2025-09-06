import { createFileRoute } from "@tanstack/react-router";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import { useCreateCandidate } from "@/api/mutations/candidates";
import type { CandidateRead } from "@/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCandidatesTable } from "@/components/candidates/table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusIcon, UploadIcon } from "lucide-react";

export const Route = createFileRoute("/_protectedLayout/candidates/")({
	component: CandidatesPage,
});

function CandidatesPage() {
	const candidates = useSuspenseQuery(candidatesQueryOptions());

	const table = useCandidatesTable(candidates.data ?? []);

	return <div className="space-y-6">
		<header className="flex flex-row justify-between items-center">
			<div className="flex flex-col">
				<h1 className="text-2xl font-bold mb-2">
					Кандидаты
				</h1>
				<p className="text-muted-foreground">
					Управление кандидатами и отслеживание процесса найма
				</p>
			</div>
			<div className="flex flex-row gap-2">
				<Button variant="outline">
					<PlusIcon />
					Создать
				</Button>
				<Button variant="outline">
					<UploadIcon />
					Загрузить резюме
				</Button>
			</div>
		</header>
		<main>
			<DataTable table={table} />
		</main>
	</div>
}

