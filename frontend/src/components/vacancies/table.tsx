import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { VacancyRead } from "../../api/client";
import { VacancyStatusBadge } from "./status-badge";
import { RelativeTimeTooltip } from "../ui/relative-time-tooltip";
import { Link } from "@tanstack/react-router";

export function useVacanciesTable(data: VacancyRead[]) {
	const columns = useMemo<ColumnDef<VacancyRead>[]>(
		() => [
			{
				id: "title",
				header: "Вакансия",
				cell: ({ row }) => (
					<Link
						to="/vacancies/$vacancyId"
						params={{ vacancyId: row.original.id.toString() }}
						className="font-medium"
					>
						{row.original.title}
					</Link>
				),
			},
			{
				accessorKey: "status",
				header: "Статус",
				cell: ({ row }) => <VacancyStatusBadge status={row.original.status} />,
			},
			{
				accessorKey: "created_at",
				header: "Дата создания",
				cell: ({ row }) =>
					row.original.created_at ? (
						<RelativeTimeTooltip date={new Date(row.original.created_at)} />
					) : (
						<>&mdash;</>
					),
			},
			{
				accessorKey: "updated_at",
				header: "Последнее обновление",
				cell: ({ row }) =>
					row.original.updated_at ? (
						<RelativeTimeTooltip
							relative
							date={new Date(row.original.updated_at)}
						/>
					) : (
						<>&mdash;</>
					),
			},
		],
		[],
	);

	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable<VacancyRead>({
		data: data ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting },
		onSortingChange: setSorting,
	});

	return table;
}
