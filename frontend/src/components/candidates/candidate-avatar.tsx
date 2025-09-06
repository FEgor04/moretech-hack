import { Avatar, AvatarFallback } from "../ui/avatar";

export function CandidateAvatar({ name }: { name: string }) {
    const initials = name.split(" ").map(n => n[0]).join("").toLocaleUpperCase();
	return <Avatar>
        <AvatarFallback>
            {initials}
        </AvatarFallback>
    </Avatar>
}