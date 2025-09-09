"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsInputProps {
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	className?: string;
}

export function TagsInput({
	value,
	onChange,
	placeholder = "Введите и нажмите Enter",
	className,
}: TagsInputProps) {
	const [inputValue, setInputValue] = useState("");

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && inputValue.trim()) {
			e.preventDefault();
			const newTag = inputValue.trim();
			if (!value.includes(newTag)) {
				onChange([...value, newTag]);
			}
			setInputValue("");
		} else if (e.key === "Backspace" && !inputValue && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	};

	const removeTag = (tagToRemove: string) => {
		onChange(value.filter((tag) => tag !== tagToRemove));
	};

	return (
		<div className={cn("space-y-2", className)}>
			<Input
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
			/>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{value.map((tag) => (
						<Badge
							key={tag}
							variant="secondary"
							className="flex items-center gap-1"
						>
							{tag}
							<button
								type="button"
								onClick={() => removeTag(tag)}
								className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							>
								<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
