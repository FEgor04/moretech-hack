import { Badge } from "../ui/badge";

// Backend uses: open | closed (string)

type VacancyStatus = "open" | "closed";

const statusClass: Record<VacancyStatus, string> = {
	open: "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
	closed: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900",
};

const statusText: Record<VacancyStatus, string> = {
	open: "Открыта",
	closed: "Закрыта",
};

export function VacancyStatusBadge({
	status,
}: { status: string | null | undefined }) {
	if (!status) {
		return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
	}

	const normalized = status.toLowerCase() as VacancyStatus;

	if (normalized !== "open" && normalized !== "closed") {
		return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
	}

	return (
		<Badge className={statusClass[normalized]}>{statusText[normalized]}</Badge>
	);
}
