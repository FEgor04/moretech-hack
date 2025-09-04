import {
	Link,
	Outlet,
	createFileRoute,
	redirect,
} from "@tanstack/react-router";
import { useMeQuery } from "../api/queries/auth";
import { isAuthenticated, clearAccessToken } from "../lib/auth";

export const Route = createFileRoute("/_protectedLayout")({
	beforeLoad: async () => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const me = useMeQuery();

	if (me.isError) {
		clearAccessToken();
		throw redirect({ to: "/sign-in" });
	}

	return (
		<div className="p-4">
			<div className="mb-4 flex items-center justify-between">
				<nav className="flex gap-3 text-sm">
					<Link to="/">Home</Link>
					<Link to="/candidates">Candidates</Link>
					<Link to="/vacancies">Vacancies</Link>
				</nav>
				<button
					type="button"
					onClick={() => {
						clearAccessToken();
						window.location.href = "/sign-in";
					}}
					className="rounded-md border px-3 py-1 text-sm"
				>
					Sign out
				</button>
			</div>
			<Outlet />
		</div>
	);
}
