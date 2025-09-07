import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_protectedLayout/vacancies/$vacancyId")({
	component: VacancyLayout,
});

function VacancyLayout() {
	return (
		<div>
			<div className="max-w-6xl mx-auto p-6">
				<Outlet />
			</div>
		</div>
	);
}
