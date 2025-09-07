import { Badge } from "../ui/badge";

export function InterviewFeedbackBadge({ positive }: { positive: boolean }) {
	return (
		<Badge variant={positive ? "default" : "destructive"}>
			{positive ? "Положительный" : "Отрицательный"}
		</Badge>
	);
}
