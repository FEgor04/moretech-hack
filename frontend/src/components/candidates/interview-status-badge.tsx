import type { InterviewState } from "@/api/client";
import { Badge } from "../ui/badge";

const stateClass: Record<InterviewState, string> = {
	initialized: "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900",
	in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
	done: "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
};

const stateText: Record<InterviewState, string> = {
	initialized: "Создано",
	in_progress: "В процессе",
	done: "Завершено",
};

export function InterviewStatusBadge({ state }: { state: InterviewState }) {
	return <Badge className={stateClass[state]}>{stateText[state]}</Badge>;
}