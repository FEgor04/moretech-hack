import {
	Link,
	Outlet,
	createFileRoute,
	redirect,
} from "@tanstack/react-router";
import { isAuthenticated, clearAccessToken } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/api/queries/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

export const Route = createFileRoute("/_protectedLayout")({
	beforeLoad: async ({ context }) => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/sign-in" });
		}

		try {
			await context.queryClient.fetchQuery(meQueryOptions());
		} catch (error) {
			clearAccessToken();
			throw redirect({ to: "/sign-in" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const me = useSuspenseQuery(meQueryOptions());

	if (me.isError) {
		clearAccessToken();
		throw redirect({ to: "/sign-in" });
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full">
				<header className="h-12 border-b w-full bg-sidebar flex items-center px-4">
					<SidebarTrigger />
				</header>
				<div className="p-4">
					<Outlet />
				</div>
			</main>
		</SidebarProvider>
	);
}
