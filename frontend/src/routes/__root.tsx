import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { Suspense } from "react";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanstackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => (
		<>
			<Suspense
				fallback={
					<div className="p-4">
						<div className="space-y-4">
							<div className="h-8 w-48 rounded-md bg-accent animate-pulse" />
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								<div className="h-32 rounded-md bg-accent animate-pulse" />
								<div className="h-32 rounded-md bg-accent animate-pulse" />
								<div className="h-32 rounded-md bg-accent animate-pulse" />
							</div>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
								<div className="h-64 rounded-md bg-accent animate-pulse" />
								<div className="h-64 rounded-md bg-accent animate-pulse" />
							</div>
						</div>
					</div>
				}
			>
				<Outlet />
			</Suspense>
			<Toaster richColors />
			<TanstackDevtools
				config={{
					position: "bottom-left",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					TanStackQueryDevtools,
				]}
			/>
		</>
	),
});
