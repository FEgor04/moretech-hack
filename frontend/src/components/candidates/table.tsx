import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { CandidateRead } from "../../api/client";
import { useDeleteCandidate } from "../../api/mutations/candidates";

export function useCandidatesTable(data: CandidateRead[]) {
	const deleteMutation = useDeleteCandidate();

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

	const table = useReactTable<CandidateRead>({
		data: data ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting },
		onSortingChange: setSorting,
	});

	return table;
}
