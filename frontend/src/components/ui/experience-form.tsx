"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, TrashIcon } from "lucide-react";
import type { ExperienceItem } from "@/api/client/types.gen";

interface ExperienceFormProps {
	value: ExperienceItem[];
	onChange: (value: ExperienceItem[]) => void;
}

export function ExperienceForm({ value, onChange }: ExperienceFormProps) {
	const addExperience = () => {
		const newExperience: ExperienceItem = {
			company: "",
			position: "",
			years: 0,
			start_date: null,
			end_date: null,
		};
		onChange([...value, newExperience]);
	};

	const updateExperience = (
		index: number,
		field: keyof ExperienceItem,
		newValue: string | number | null,
	) => {
		const updated = [...value];
		updated[index] = { ...updated[index], [field]: newValue };

		// Валидация дат
		if (field === "start_date" || field === "end_date") {
			const startDate =
				field === "start_date" ? newValue : updated[index].start_date;
			const endDate = field === "end_date" ? newValue : updated[index].end_date;

			if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
				// Если дата начала больше даты окончания, сбрасываем дату окончания
				if (field === "start_date") {
					updated[index].end_date = null;
				} else {
					updated[index].start_date = null;
				}
			}
		}

		onChange(updated);
	};

	const removeExperience = (index: number) => {
		const updated = value.filter((_, i) => i !== index);
		onChange(updated);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">Опыт работы</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addExperience}
					className="flex items-center gap-2"
				>
					<PlusIcon className="h-4 w-4" />
					Добавить
				</Button>
			</div>

			{value.map((experience, index) => (
				<Card
					key={`experience-${experience.company}-${experience.position}-${index}`}
					className="border border-gray-200"
				>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">
								Место работы {index + 1}
							</CardTitle>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => removeExperience(index)}
								className="text-red-600 hover:text-red-700 hover:bg-red-50"
							>
								<TrashIcon className="h-4 w-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`experience-${index}-company`}>
									Компания *
								</Label>
								<Input
									id={`experience-${index}-company`}
									value={experience.company}
									onChange={(e) =>
										updateExperience(index, "company", e.target.value)
									}
									placeholder="Яндекс, Google, Сбер..."
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`experience-${index}-position`}>
									Должность *
								</Label>
								<Input
									id={`experience-${index}-position`}
									value={experience.position}
									onChange={(e) =>
										updateExperience(index, "position", e.target.value)
									}
									placeholder="Frontend Developer, Backend Developer..."
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`experience-${index}-years`}>Опыт (лет) *</Label>
							<Input
								id={`experience-${index}-years`}
								type="number"
								min="0"
								max="50"
								step="0.5"
								value={experience.years}
								onChange={(e) =>
									updateExperience(
										index,
										"years",
										Number.parseFloat(e.target.value) || 0,
									)
								}
								placeholder="2.5"
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`experience-${index}-start-date`}>
									Дата начала
								</Label>
								<Input
									id={`experience-${index}-start-date`}
									type="date"
									value={
										experience.start_date
											? new Date(experience.start_date)
													.toISOString()
													.split("T")[0]
											: ""
									}
									onChange={(e) =>
										updateExperience(
											index,
											"start_date",
											e.target.value
												? new Date(e.target.value).toISOString()
												: null,
										)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`experience-${index}-end-date`}>
									Дата окончания
								</Label>
								<Input
									id={`experience-${index}-end-date`}
									type="date"
									value={
										experience.end_date
											? new Date(experience.end_date)
													.toISOString()
													.split("T")[0]
											: ""
									}
									onChange={(e) =>
										updateExperience(
											index,
											"end_date",
											e.target.value
												? new Date(e.target.value).toISOString()
												: null,
										)
									}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			))}

			{value.length === 0 && (
				<div className="text-center py-8 text-gray-500">
					<p>Опыт работы не указан</p>
					<Button
						type="button"
						variant="outline"
						onClick={addExperience}
						className="mt-2"
					>
						Добавить опыт работы
					</Button>
				</div>
			)}
		</div>
	);
}
