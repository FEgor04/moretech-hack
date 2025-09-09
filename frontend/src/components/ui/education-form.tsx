"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, TrashIcon } from "lucide-react";
import type { EducationItem } from "@/api/client/types.gen";

interface EducationFormProps {
	value: EducationItem[];
	onChange: (value: EducationItem[]) => void;
}

export function EducationForm({ value, onChange }: EducationFormProps) {
	const addEducation = () => {
		const newEducation: EducationItem = {
			organization: "",
			speciality: "",
			type: "",
			start_date: null,
			end_date: null,
		};
		onChange([...value, newEducation]);
	};

	const updateEducation = (
		index: number,
		field: keyof EducationItem,
		newValue: string | null,
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

	const removeEducation = (index: number) => {
		const updated = value.filter((_, i) => i !== index);
		onChange(updated);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">Образование</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addEducation}
					className="flex items-center gap-2"
				>
					<PlusIcon className="h-4 w-4" />
					Добавить
				</Button>
			</div>

			{value.map((education, index) => (
				<Card
					key={`education-${education.organization}-${education.speciality}-${index}`}
					className="border border-gray-200"
				>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">
								Образование {index + 1}
							</CardTitle>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => removeEducation(index)}
								className="text-red-600 hover:text-red-700 hover:bg-red-50"
							>
								<TrashIcon className="h-4 w-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`education-${index}-organization`}>
									Учебное заведение *
								</Label>
								<Input
									id={`education-${index}-organization`}
									value={education.organization}
									onChange={(e) =>
										updateEducation(index, "organization", e.target.value)
									}
									placeholder="МГУ, МФТИ, ВШЭ..."
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`education-${index}-type`}>
									Тип образования
								</Label>
								<Input
									id={`education-${index}-type`}
									value={education.type || ""}
									onChange={(e) =>
										updateEducation(index, "type", e.target.value)
									}
									placeholder="Высшее, Среднее, Курсы..."
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`education-${index}-speciality`}>
								Специальность *
							</Label>
							<Input
								id={`education-${index}-speciality`}
								value={education.speciality}
								onChange={(e) =>
									updateEducation(index, "speciality", e.target.value)
								}
								placeholder="Информатика и вычислительная техника..."
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={`education-${index}-start-date`}>
									Дата начала
								</Label>
								<Input
									id={`education-${index}-start-date`}
									type="date"
									value={
										education.start_date
											? new Date(education.start_date)
													.toISOString()
													.split("T")[0]
											: ""
									}
									onChange={(e) =>
										updateEducation(
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
								<Label htmlFor={`education-${index}-end-date`}>
									Дата окончания
								</Label>
								<Input
									id={`education-${index}-end-date`}
									type="date"
									value={
										education.end_date
											? new Date(education.end_date).toISOString().split("T")[0]
											: ""
									}
									onChange={(e) =>
										updateEducation(
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
					<p>Образование не указано</p>
					<Button
						type="button"
						variant="outline"
						onClick={addEducation}
						className="mt-2"
					>
						Добавить образование
					</Button>
				</div>
			)}
		</div>
	);
}
