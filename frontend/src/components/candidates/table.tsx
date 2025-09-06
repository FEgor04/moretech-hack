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
import { CandidateStatusBadge } from "./status-badge";
import { RelativeTimeTooltip } from "../ui/relative-time-tooltip";
import { CandidateAvatar } from "./candidate-avatar";

export function useCandidatesTable(data: CandidateRead[]) {
	const deleteMutation = useDeleteCandidate();

	const columns = useMemo<ColumnDef<CandidateRead>[]>(
		() => [
			{ id: "name", header: "Кандидат", cell: ({row}) => <div className="flex flex-row gap-2 items-center">
				<CandidateAvatar name={row.original.name} />
				<div className="flex flex-col">
				<span className="font-medium">
					{row.original.name}
				</span>
				<span className="text-muted-foreground">
					{row.original.email}
				</span>
</div>
			</div> },
			{
				accessorKey: "position",
				header: "Должность",
				cell: ({row}) => row.original.position || <>&mdash;</>
			},
			{
				accessorKey: "experience",
				header: "Опыт",
				cell: ({row}) => row.original.experience || <>&mdash;</>
			},
			{
				accessorKey: "status",
				header: "Статус",
				cell: ({row}) => row.original.status ? <CandidateStatusBadge status={row.original.status} /> : <>&mdash;</>
			},
			{
				accessorKey: "created_at",
				header: "Дата создания",
				cell: ({row}) => row.original.created_at ? <RelativeTimeTooltip date={new Date(row.original.created_at)} /> : <>&mdash;</>
			},
			{
				accessorKey: "updated_at",
				header: "Последнее обновление	",
				cell: ({row}) => row.original.updated_at ? <RelativeTimeTooltip relative date={new Date(row.original.updated_at)} /> : <>&mdash;</>
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
