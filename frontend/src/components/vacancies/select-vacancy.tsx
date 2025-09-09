import { useSuspenseQuery } from "@tanstack/react-query";
import { vacanciesQueryOptions } from "@/api/queries/vacancies";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SelectVacancyProps {
	value?: number;
	onValueChange: (value?: number) => void;
	placeholder?: string;
	className?: string;
}

export function SelectVacancy({
	value,
	onValueChange,
	placeholder = "Выберите вакансию",
	className,
}: SelectVacancyProps) {
	const vacancies = useSuspenseQuery(vacanciesQueryOptions());

	return (
		<Select
			value={value != null ? String(value) : undefined}
			onValueChange={(v) => onValueChange(v ? Number(v) : undefined)}
		>
			<SelectTrigger className={`${className ?? ""} max-w-full`}>
				<SelectValue placeholder={placeholder} className="truncate" />
			</SelectTrigger>
			<SelectContent>
				{vacancies.data.map((vacancy) => (
					<SelectItem key={vacancy.id} value={String(vacancy.id)}>
						<span className="block max-w-[360px] truncate">
							{vacancy.title}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
