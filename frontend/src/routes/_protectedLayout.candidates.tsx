import { createFileRoute, Link } from "@tanstack/react-router";
import {
	createCandidateCandidatesPost,
	deleteCandidateCandidatesCandidateIdDelete,
	listCandidatesCandidatesGet,
} from "../api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { CandidateRead } from "../api/client";

export const Route = createFileRoute("/_protectedLayout/candidates")({
	component: CandidatesPage,
});

function CandidatesPage() {
	const queryClient = useQueryClient();
	const candidates = useQuery({
		queryKey: ["candidates"],
		queryFn: async () => {
			const res = await listCandidatesCandidatesGet<true>({ throwOnError: true });
			return res.data;
		},
	});

	type CandidateCreateBody = {
		name: string;
		email: string;
		status?: string | null;
		resume_url?: string | null;
		notes?: string | null;
	};

	const createMutation = useMutation({
		mutationFn: async (body: CandidateCreateBody) => {
			const res = await createCandidateCandidatesPost<true>({ body, throwOnError: true });
			return res.data;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidates"] }),
	});

	const deleteMutation = useMutation({
		mutationFn: async (candidate_id: string) => {
			await deleteCandidateCandidatesCandidateIdDelete<true>({
				path: { candidate_id },
				throwOnError: true,
			});
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidates"] }),
	});

	const columns = useMemo<ColumnDef<CandidateRead>[]>(
		() => [
			{ accessorKey: "name", header: "Name" },
			{ accessorKey: "email", header: "Email" },
			{ accessorKey: "status", header: "Status" },
			{
				header: "Actions",
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Link
							to="/candidates/$candidateId"
							params={{ candidateId: row.original.id }}
							className="text-blue-600 hover:underline"
						>
							Open
						</Link>
						<button
							type="button"
							onClick={() => deleteMutation.mutate(row.original.id)}
							className="text-red-600"
						>
							Delete
						</button>
					</div>
				),
			},
		],
		[deleteMutation],
	);

	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data: (candidates.data ?? []) as CandidateRead[],
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting },
		onSortingChange: setSorting,
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Candidates</h1>
			</div>
			<div className="overflow-auto rounded-md border">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 text-left">
						{table.getHeaderGroups().map((hg) => (
							<tr key={hg.id}>
								{hg.headers.map((h) => (
									<th key={h.id} className="px-3 py-2">
										{h.isPlaceholder
												? null
												: flexRender(h.column.columnDef.header, h.getContext())}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className="border-t">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-3 py-2">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget as HTMLFormElement);
					createMutation.mutate({
						name: String(fd.get("name") || ""),
						email: String(fd.get("email") || ""),
						status: String(fd.get("status") || "") || null,
						resume_url: String(fd.get("resume_url") || "") || null,
						notes: String(fd.get("notes") || "") || null,
					});
				}}
				className="rounded-md border p-3"
			>
				<h2 className="mb-2 font-medium">Quick add</h2>
				<div className="grid grid-cols-2 gap-2">
					<input name="name" placeholder="Name" className="rounded-md border px-2 py-1" />
					<input name="email" placeholder="Email" className="rounded-md border px-2 py-1" />
					<input name="status" placeholder="Status" className="rounded-md border px-2 py-1" />
					<input name="resume_url" placeholder="Resume URL" className="rounded-md border px-2 py-1" />
					<input name="notes" placeholder="Notes" className="col-span-2 rounded-md border px-2 py-1" />
				</div>
				<button
					type="submit"
					disabled={createMutation.isPending}
					className="mt-3 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
				>
					{createMutation.isPending ? "Creating..." : "Create"}
				</button>
			</form>
		</div>
	);
}
