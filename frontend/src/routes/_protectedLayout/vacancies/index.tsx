import { createFileRoute, Link } from "@tanstack/react-router";
import { vacanciesQueryOptions } from "@/api/queries/vacancies";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useVacanciesTable } from "@/components/vacancies/table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { CreateFromPDFButton } from "@/components/vacancies/create-from-pdf";
import { PlusIcon } from "lucide-react";

export const Route = createFileRoute("/_protectedLayout/vacancies/")({
	component: VacanciesPage,
	loader: async ({ context }) => {
		const vacancies = await context.queryClient.fetchQuery(
			vacanciesQueryOptions(),
		);
		return { vacancies };
	},
});

function VacanciesPage() {
	const vacancies = useSuspenseQuery(vacanciesQueryOptions());

	const table = useVacanciesTable(vacancies.data ?? []);

	return (
		<div className="space-y-6">
			<header className="flex flex-row justify-between items-center">
				<div className="flex flex-col">
					<h1 className="text-2xl font-bold mb-2">Вакансии</h1>
					<p className="text-muted-foreground">
						Управление вакансиями и отслеживание открытых позиций
					</p>
				</div>
				<div className="flex flex-row gap-2">
					<Button variant="outline" asChild>
						<Link to="/vacancies/new">
							<PlusIcon />
							Создать
						</Link>
					</Button>
					<CreateFromPDFButton />
				</div>
			</header>
			<main>
				<DataTable table={table} />
			</main>
		</div>
	);
}
