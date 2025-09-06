import { Badge } from "../ui/badge";

// Define possible vacancy statuses (these should match your backend)
type VacancyStatus = "draft" | "published" | "closed" | "archived";

const statusClass: Record<VacancyStatus, string> = {
	draft: "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900",
	published:
		"bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
	closed: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900",
	archived: "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900",
};

const statusText: Record<VacancyStatus, string> = {
	draft: "Черновик",
	published: "Опубликована",
	closed: "Закрыта",
	archived: "Архив",
};

export function VacancyStatusBadge({
	status,
}: { status: string | null | undefined }) {
	if (!status) {
		return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
	}

	// Type assertion for status - in a real app, you'd want proper type checking
	const vacancyStatus = status as VacancyStatus;

	return (
		<Badge className={statusClass[vacancyStatus]}>
			{statusText[vacancyStatus]}
		</Badge>
	);
}
