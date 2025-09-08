import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { isAuthenticated, clearAccessToken } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/api/queries/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

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
					<Suspense
						fallback={
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<Skeleton className="h-8 w-48" />
									<Skeleton className="h-8 w-24" />
								</div>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									<Skeleton className="h-32" />
									<Skeleton className="h-32" />
									<Skeleton className="h-32" />
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<Skeleton className="h-64" />
									<Skeleton className="h-64" />
								</div>
							</div>
						}
					>
						<Outlet />
					</Suspense>
				</div>
			</main>
		</SidebarProvider>
	);
}
