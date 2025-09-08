import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { CandidateRead, ExperienceItem } from "../../api/client";
import { CandidateStatusBadge } from "./status-badge";
import { RelativeTimeTooltip } from "../ui/relative-time-tooltip";
import { CandidateAvatar } from "./candidate-avatar";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useDeleteCandidate } from "@/api/mutations/candidates";
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

export function useCandidatesTable(data: CandidateRead[]) {
	const deleteMutation = useDeleteCandidate();

	const columns = useMemo<ColumnDef<CandidateRead>[]>(
		() => [
			{
				id: "name",
				header: "Кандидат",
				cell: ({ row }) => (
					<div className="flex flex-row gap-2 items-center">
						<CandidateAvatar name={row.original.name} />
						<div className="flex flex-col">
							<Link
								to="/candidates/$candidateId"
								params={{ candidateId: row.original.id }}
								className="font-medium"
							>
								{row.original.name}
							</Link>
							<span className="text-muted-foreground">
								{row.original.email}
							</span>
						</div>
					</div>
				),
			},
			{
				accessorKey: "position",
				header: "Должность",
				cell: ({ row }) => row.original.position || <>&mdash;</>,
			},
			{
				accessorKey: "experience",
				header: "Опыт",
				cell: ({ row }) => {
					const experience = row.original.experience;
					if (!experience) {
						return <>&mdash;</>;
					}

					// Handle both string and array types
                                        let experienceArray: ExperienceItem[] = [];
					if (typeof experience === "string") {
						try {
							experienceArray = JSON.parse(experience);
						} catch {
							return <>&mdash;</>;
						}
					} else if (Array.isArray(experience)) {
						experienceArray = experience;
					}

					if (experienceArray.length === 0) {
						return <>&mdash;</>;
					}

					// Calculate total years from experience array
                                        const totalYears = experienceArray.reduce((sum: number, exp: ExperienceItem) => {
						return sum + (exp.years || 0);
					}, 0);
					return totalYears > 0 ? `${totalYears} лет` : <>&mdash;</>;
				},
			},
			{
				accessorKey: "status",
				header: "Статус",
				cell: ({ row }) =>
					row.original.status ? (
						<CandidateStatusBadge status={row.original.status} />
					) : (
						<>&mdash;</>
					),
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
				cell: ({ row }) => {
					const candidate = row.original;
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0">
									<span className="sr-only">Открыть меню</span>
									<MoreHorizontalIcon className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem
											onSelect={(e) => e.preventDefault()}
											className="text-red-600"
										>
											<TrashIcon className="mr-2 h-4 w-4" />
											Удалить
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Вы уверены, что хотите удалить кандидата?
											</AlertDialogTitle>
											<AlertDialogDescription>
												Это действие нельзя отменить. Кандидат &quot;
												{candidate.name}&quot; будет безвозвратно удален вместе
												со всеми связанными данными.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Отмена</AlertDialogCancel>
											<AlertDialogAction
												onClick={() => {
													deleteMutation.mutate(candidate.id, {
														onSuccess: () => {
															toast.success("Кандидат удален", {
																description: `Кандидат "${candidate.name}" успешно удален.`,
															});
														},
														onError: (error) => {
															toast.error("Ошибка при удалении кандидата", {
																description: error.message,
															});
														},
													});
												}}
											>
												Удалить
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
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
