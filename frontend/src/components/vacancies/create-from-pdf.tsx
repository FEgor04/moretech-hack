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

export function CreateFromPDFButton() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);

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

	const handleUpload = () => {
		if (!selectedFile) return;

		// TODO: Implement when backend supports vacancy PDF upload
		toast.error("Функция загрузки PDF для вакансий пока не реализована", {
			description: "Обратитесь к администратору для добавления этой функции",
		});
	};

	const resetForm = () => {
		setSelectedFile(null);
		setError(null);
	};

	return (
		<Dialog onOpenChange={(open) => !open && resetForm()}>
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
						disabled
					>
						<DropzoneContent>
							<div className="space-y-2">
								<UploadIcon className="w-8 h-8 text-muted-foreground mx-auto" />
								<p className="text-sm font-medium text-muted-foreground">
									{selectedFile?.name || "Функция недоступна"}
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
										Функция загрузки PDF для вакансий пока не реализована
									</p>
									<p className="text-xs text-muted-foreground">
										Обратитесь к администратору
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
					<Button onClick={handleUpload} disabled={true} className="w-full">
						<UploadIcon className="w-4 h-4 mr-2" />
						Функция недоступна
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
