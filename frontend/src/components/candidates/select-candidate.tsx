import { useSuspenseQuery } from "@tanstack/react-query";
import { candidatesQueryOptions } from "@/api/queries/candidates";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SelectCandidateProps {
	value?: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	excludeCandidateId?: string;
}

export function SelectCandidate({
	value,
	onValueChange,
	placeholder = "Выберите кандидата",
	excludeCandidateId,
	...props
}: SelectCandidateProps) {
	const candidates = useSuspenseQuery(candidatesQueryOptions());

	const filteredCandidates = candidates.data.filter(
		(candidate) => candidate.id !== excludeCandidateId,
	);

	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger
				{...props}
				className={`${props.className ?? ""} max-w-full`}
			>
				<SelectValue placeholder={placeholder} className="truncate" />
			</SelectTrigger>
			<SelectContent>
				{filteredCandidates.map((candidate) => (
					<SelectItem key={candidate.id} value={candidate.id}>
						<span className="block max-w-[360px] truncate">
							{candidate.name} - {candidate.position}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
