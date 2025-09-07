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
import { Label } from "../ui/label";
import { InterviewStatusBadge } from "./interview-status-badge";
import { InterviewFeedbackBadge } from "./interview-feedback-badge";

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
									<InterviewStatusBadge state={interview.state} />
									{interview.feedback_positive != null && (
										<InterviewFeedbackBadge
											positive={interview.feedback_positive}
										/>
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
										<Tooltip>
											<TooltipTrigger asChild>
												<Button variant="outline" size="icon">
													<NotebookIcon />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Оставить заметки</TooltipContent>
										</Tooltip>
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
