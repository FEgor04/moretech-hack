import { UploadIcon, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import {
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
} from "../ui/kibo-ui/dropzone";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateFromPDF } from "../../api/mutations/vacancies";

export function CreateFromPDFButton() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const createFromPDFMutation = useCreateFromPDF();

	const handleFileDrop = (acceptedFiles: File[]) => {
		setError(null);
		const file = acceptedFiles[0];

		if (file) {
			setSelectedFile(file);
		}
	};

	const handleError = (error: Error) => {
		setError(error.message);
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		try {
			await createFromPDFMutation.mutateAsync(selectedFile);
			toast.success("Вакансия успешно создана из PDF", {
				description: "Вакансия была загружена и обработана",
			});
			setIsOpen(false);
			resetForm();
		} catch (error) {
			console.error("Error uploading PDF:", error);
			toast.error("Ошибка при загрузке PDF", {
				description: "Не удалось создать вакансию из PDF файла",
			});
		}
	};

	const resetForm = () => {
		setSelectedFile(null);
		setError(null);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (!open) resetForm();
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline">
					<UploadIcon className="w-4 h-4 mr-2" />
					Загрузить PDF вакансии
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Загрузить PDF вакансии</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* File Drop Zone */}
					<Dropzone
						accept={{
							"application/pdf": [".pdf"],
						}}
						maxFiles={1}
						maxSize={10 * 1024 * 1024} // 10MB
						onDrop={handleFileDrop}
						onError={handleError}
						src={selectedFile ? [selectedFile] : undefined}
						className="h-auto"
					>
						<DropzoneContent>
							<div className="space-y-2">
								<UploadIcon className="w-8 h-8 text-muted-foreground mx-auto" />
								<p className="text-sm font-medium text-muted-foreground">
									{selectedFile?.name ||
										"Перетащите PDF файл сюда или нажмите для выбора"}
								</p>
								{selectedFile && (
									<p className="text-xs text-muted-foreground">
										{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
									</p>
								)}
							</div>
						</DropzoneContent>

						<DropzoneEmptyState>
							<div className="space-y-2">
								<UploadIcon className="w-8 h-8 text-muted-foreground mx-auto" />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Перетащите PDF файл сюда или нажмите для выбора
									</p>
									<p className="text-xs text-muted-foreground">
										Поддерживаются только PDF файлы до 10MB
									</p>
								</div>
							</div>
						</DropzoneEmptyState>
					</Dropzone>

					{/* Error Message */}
					{error && (
						<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
							<AlertCircle className="w-4 h-4 text-red-500" />
							<p className="text-sm text-red-700">{error}</p>
						</div>
					)}

					{/* Upload Button */}
					<Button
						onClick={handleUpload}
						disabled={!selectedFile || createFromPDFMutation.isPending}
						className="w-full"
					>
						<UploadIcon className="w-4 h-4 mr-2" />
						{createFromPDFMutation.isPending ? "Загрузка..." : "Загрузить PDF"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
