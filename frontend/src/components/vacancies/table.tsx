import { useMemo, useState, useCallback } from "react";
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
import { Button } from "../ui/button";
import { Trash2Icon, BarChart3Icon } from "lucide-react";
import { useDeleteVacancy } from "../../api/mutations/vacancies";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../ui/alert-dialog";

export function useVacanciesTable(data: VacancyRead[]) {
	const deleteMutation = useDeleteVacancy();

	// ✅ оборачиваем в useCallback, чтобы линтер был доволен
	const handleDelete = useCallback(
		(vacancyId: number, title: string) => {
			deleteMutation.mutate(vacancyId, {
				onSuccess: () => {
					toast.success(`Вакансия "${title}" удалена`);
				},
				onError: () => {
					toast.error("Ошибка при удалении вакансии");
				},
			});
		},
		[deleteMutation],
	);

	// ✅ используем handleDelete как зависимость
	const columns = useMemo<ColumnDef<VacancyRead>[]>(
		() => [
			{
				id: "title",
				header: "Вакансия",
				cell: ({ row }) => (
					<Link
						to="/vacancies/$vacancyId"
						params={{ vacancyId: row.original.id.toString() }}
						className="font-medium hover:underline"
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
			{
				id: "actions",
				header: "Действия",
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
							<Link
								to="/vacancies/$vacancyId"
								params={{ vacancyId: row.original.id.toString() }}
							>
								<BarChart3Icon className="h-4 w-4" />
								<span className="sr-only">Статистика вакансии</span>
							</Link>
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 text-destructive hover:text-destructive"
								>
									<Trash2Icon className="h-4 w-4" />
									<span className="sr-only">Удалить вакансию</span>
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Удалить вакансию</AlertDialogTitle>
									<AlertDialogDescription>
										Вы уверены, что хотите удалить вакансию "
										{row.original.title}"? Это действие нельзя отменить.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Отмена</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											handleDelete(row.original.id, row.original.title)
										}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Удалить
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				),
			},
		],
		[handleDelete],
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
