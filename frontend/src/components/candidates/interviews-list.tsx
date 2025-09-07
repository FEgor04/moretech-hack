import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { interviewsByCandidateQueryOptions } from "@/api/queries/interviews";
import { RelativeTimeTooltip } from "@/components/ui/relative-time-tooltip";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { LinkIcon, MessageCircleReply, NotebookIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { useState } from "react";
import { interviewNotesPageQueryOptions } from "@/api/queries/interviews";
import { useCreateInterviewNote } from "@/api/mutations/interviews";

interface InterviewsListProps {
	candidateId: string;
}

export function InterviewsList({ candidateId }: InterviewsListProps) {
	const interviews = useSuspenseQuery(
		interviewsByCandidateQueryOptions(candidateId),
	);

	const vacancies = useSuspenseQueries({
		queries: interviews.data
			.filter((interview) => interview.vacancy_id)
			// biome-ignore lint/style/noNonNullAssertion: we already filtered it
			.map((interview) => vacancyQueryOptions(interview.vacancy_id!)),
	});

	if (interviews.data.length === 0) {
		return (
			<div className="rounded-lg border p-6 text-center text-muted-foreground">
				<p>Интервью не запланированы</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Интервью</h3>
			<div className="space-y-3">
				{interviews.data.map(
					(interview, index) =>
						interview.vacancy_id && (
							<Card key={interview.id}>
								<CardHeader className="flex flex-row items-center gap-2">
									<CardTitle>
										<Link
											to="/vacancies/$vacancyId"
											params={{ vacancyId: interview.vacancy_id?.toString() }}
										>
											{vacancies[index].data.title}
										</Link>
									</CardTitle>
									{interview.feedback_positive != null && (
										<Badge
											variant={
												interview.feedback_positive ? "default" : "destructive"
											}
										>
											{interview.feedback_positive
												? "Положительный"
												: "Отрицательный"}
										</Badge>
									)}
									<div className="ml-auto flex gap-2">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="outline"
													size="icon"
													onClick={() => {
														const url = `${window.location.origin}/interviews/${interview.id}`;
														void navigator.clipboard.writeText(url).then(
															() =>
																toast.success(
																	"Ссылка на собеседование скопирована",
																),
															() =>
																toast.error("Не удалось скопировать ссылку"),
														);
													}}
												>
													<LinkIcon />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Скопировать ссылку на собеседование
											</TooltipContent>
										</Tooltip>
										<Dialog>
											<DialogTrigger asChild>
												<Button variant="outline" size="icon">
													<NotebookIcon />
												</Button>
											</DialogTrigger>
											<DialogContent className="max-w-lg">
												<DialogHeader>
													<DialogTitle>Заметки для интервью</DialogTitle>
												</DialogHeader>
												<InterviewNotesPane interviewId={interview.id} />
											</DialogContent>
										</Dialog>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button variant="outline" size="icon">
													<MessageCircleReply />
												</Button>
											</TooltipTrigger>
											<TooltipContent align="end">
												Оставить обратную связь
											</TooltipContent>
										</Tooltip>
									</div>
								</CardHeader>
								<CardContent className="space-y-4 text-sm [&>div]:space-y-1">
									{interview.created_at && (
										<div>
											<Label>Создано</Label>
											<RelativeTimeTooltip
												date={new Date(interview.created_at)}
											/>
										</div>
									)}
									{interview.feedback && (
										<div>
											<Label>Фидбек</Label>
											<p>{interview.feedback}</p>
										</div>
									)}
								</CardContent>
							</Card>
						),
				)}
			</div>
		</div>
	);
}

function InterviewNotesPane({ interviewId }: { interviewId: string }) {
	const [limit] = useState(10);
	const [offset, setOffset] = useState(0);
	const page = useSuspenseQuery(
		interviewNotesPageQueryOptions(interviewId, limit, offset),
	);
	const create = useCreateInterviewNote(interviewId);

	return (
		<div className="space-y-3">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const formEl = e.currentTarget as HTMLFormElement;
					const input = formEl.elements.namedItem(
						"noteText",
					) as HTMLInputElement;
					const value = input.value.trim();
					if (!value) return;
					create.mutate(value, {
						onSuccess: () => {
							input.value = "";
							setOffset(0); // refresh from first page
						},
					});
				}}
				className="flex gap-2"
			>
				<Input
					name="noteText"
					placeholder="Оставить заметку..."
					className="flex-1"
				/>
				<Button type="submit" disabled={create.isPending}>
					{create.isPending ? "Добавление..." : "Добавить"}
				</Button>
			</form>

			<div className="space-y-2 max-h-80 overflow-auto pr-1">
				{page.data?.length ? (
					page.data.map((n) => (
						<div key={n.id} className="p-2 border rounded text-sm">
							<div className="text-muted-foreground text-xs mb-1">
								{n.created_at ? new Date(n.created_at).toLocaleString() : ""}
							</div>
							<div>{n.text}</div>
						</div>
					))
				) : (
					<div className="text-sm text-muted-foreground">Заметок пока нет</div>
				)}
			</div>
			<div className="flex justify-center">
				<Button variant="outline" onClick={() => setOffset(offset + limit)}>
					Показать ещё
				</Button>
			</div>
		</div>
	);
}
