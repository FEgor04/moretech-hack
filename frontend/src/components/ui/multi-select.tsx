"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
	label: string;
	value: string;
}

interface MultiSelectProps {
	options: MultiSelectOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	className?: string;
}

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = "Выберите опции...",
	className,
}: MultiSelectProps) {
	const [open, setOpen] = React.useState(false);

	const handleUnselect = (item: string) => {
		onChange(selected.filter((i) => i !== item));
	};

	const handleSelect = (currentValue: string) => {
		if (selected.includes(currentValue)) {
			onChange(selected.filter((item) => item !== currentValue));
		} else {
			onChange([...selected, currentValue]);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				{/* biome-ignore lint/a11y/useSemanticElements: Multi-select requires custom combobox implementation */}
				<div
					role="combobox"
					aria-expanded={open}
					aria-controls="multi-select-content"
					tabIndex={0}
					className={cn(
						"flex min-h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
				>
					<div className="flex flex-wrap gap-1">
						{selected.map((item) => (
							<Badge
								variant="secondary"
								key={item}
								className="mr-1 mb-1"
								onClick={() => handleUnselect(item)}
							>
								{item}
								<button
									type="button"
									className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleUnselect(item);
										}
									}}
									onMouseDown={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									onClick={() => handleUnselect(item)}
								>
									<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
								</button>
							</Badge>
						))}
					</div>
					<div className="flex items-center">
						{selected.length === 0 && (
							<span className="text-muted-foreground">{placeholder}</span>
						)}
					</div>
				</div>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command>
					<CommandInput placeholder="Поиск..." />
					<CommandList>
						<CommandEmpty>Ничего не найдено.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={() => handleSelect(option.value)}
								>
									<div
										className={cn(
											"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
											selected.includes(option.value)
												? "bg-primary text-primary-foreground"
												: "opacity-50 [&_svg]:invisible",
										)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="h-3 w-3"
										>
											<title>Checkmark</title>
											<polyline points="20,6 9,17 4,12" />
										</svg>
									</div>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
