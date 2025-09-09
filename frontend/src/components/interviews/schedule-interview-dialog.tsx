import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCreateInterviewMutation } from "@/api/mutations/interviews";
import { useSuspenseQuery } from "@tanstack/react-query";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { SelectVacancy } from "@/components/vacancies/select-vacancy";
import { SelectCandidate } from "@/components/candidates/select-candidate";
import { Skeleton } from "../ui/skeleton";

const formSchema = z.object({
	candidate_id: z.string().min(1, "Выберите кандидата"),
	vacancy_id: z.coerce.number({ error: "Выберите вакансию" }),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleInterviewDialogProps {
	currentCandidateId: string;
	children: React.ReactNode;
}

export function ScheduleInterviewDialog({
	currentCandidateId,
	children,
}: ScheduleInterviewDialogProps) {
	const [open, setOpen] = useState(false);
	const candidate = useSuspenseQuery(candidateQueryOptions(currentCandidateId));
	const createInterviewMutation = useCreateInterviewMutation();

	const form = useForm<FormData>({
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Zod version compatibility
		resolver: zodResolver(formSchema as any),
		defaultValues: {
			candidate_id: currentCandidateId,
			vacancy_id: undefined,
		},
	});

	const onSubmit = (data: FormData) => {
		createInterviewMutation.mutate(
			{
				candidate_id: data.candidate_id,
				vacancy_id: data.vacancy_id,
				state: "initialized",
			},
			{
				onSuccess: (data) => {
					toast.success("Интервью создано", {
						action: {
							label: "Скопировать ссылку",
							onClick: () => {
								navigator.clipboard.writeText(
									`${window.location.origin}/interviews/${data.id}`,
								);
							},
						},
					});
					setOpen(false);
					form.reset();
				},
				onError: (error) => {
					toast.error("Ошибка при создании интервью");
					console.error("Interview creation error:", error);
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[480px] max-w-[95vw] p-4 sm:p-6">
				<DialogHeader>
					<DialogTitle>Запланировать интервью</DialogTitle>
					<DialogDescription>
						<span className="block w-full break-words">
							Запланировать интервью с кандидатом {candidate.data.name}
						</span>
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 sm:space-y-6 overflow-hidden"
					>
						<FormField
							control={form.control}
							name="candidate_id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Кандидат</FormLabel>
									<FormControl>
										<Suspense fallback={<Skeleton className="w-full h-10" />}>
											<SelectCandidate
												value={field.value}
												onValueChange={field.onChange}
												placeholder="Выберите кандидата"
												className="w-full truncate"
											/>
										</Suspense>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="vacancy_id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Вакансия</FormLabel>
									<FormControl>
										<Suspense fallback={<Skeleton className="w-full h-10" />}>
											<SelectVacancy
												value={field.value}
												onValueChange={(v) => field.onChange(v)}
												placeholder="Выберите вакансию"
												className="w-full truncate"
											/>
										</Suspense>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
							<Button
								type="submit"
								disabled={createInterviewMutation.isPending}
								className="flex-1"
							>
								{createInterviewMutation.isPending
									? "Создание..."
									: "Создать интервью"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								className="flex-1"
							>
								Отмена
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
