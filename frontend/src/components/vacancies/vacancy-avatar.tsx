import { Avatar, AvatarFallback } from "../ui/avatar";

export function VacancyAvatar({ title }: { title: string }) {
	const initials = title
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase()
		.slice(0, 2); // Limit to 2 characters

	return (
		<Avatar>
			<AvatarFallback>{initials}</AvatarFallback>
		</Avatar>
	);
}
