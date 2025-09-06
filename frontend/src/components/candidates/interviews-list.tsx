import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { interviewsByCandidateQueryOptions } from "@/api/queries/interviews";
import { RelativeTimeTooltip } from "@/components/ui/relative-time-tooltip";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { LinkIcon, MessageCircleReply, NotebookIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
			// biome-ignore: lint/style/noNonNullAssertion
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
				{interviews.data.map((interview, index) => (
					<Card key={interview.id}>
						<CardHeader className="flex flex-row items-center">
							<CardTitle>
								<Link
									to="/vacancies/$vacancyId"
									params={{ vacancyId: interview.vacancy_id?.toString() }}
								>
									{vacancies[index].data.title}
								</Link>
							</CardTitle>
							<div className="ml-auto flex gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="outline" size="icon">
											<LinkIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Скопировать ссылку на собеседоавние
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
						<CardContent>
							{interview.created_at && (
								<div>
									Создано{" "}
									<RelativeTimeTooltip date={new Date(interview.created_at)} />
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
