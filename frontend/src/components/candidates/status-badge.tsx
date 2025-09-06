import type { CandidateStatus } from "@/api/client";
import { Badge } from "../ui/badge";

const statusClass: Record<CandidateStatus, string> = {
    pending: "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900",
    reviewing: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900",
    interviewing: "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
    accepted: "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
    rejected: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900",
    on_hold: "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900",
}

const statusText: Record<CandidateStatus, string> = {
    pending: "В ожидании",
    reviewing: "На рассмотрении",
    interviewing: "Собеседование",
    accepted: "Принят",
    rejected: "Отклонен",
    on_hold: "Приостановлен",
}


export function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
	return <Badge className={statusClass[status]}>
        {statusText[status]}
    </Badge>
}