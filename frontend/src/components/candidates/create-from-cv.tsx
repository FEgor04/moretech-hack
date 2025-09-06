import { UploadIcon, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "../ui/dialog";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "../ui/kibo-ui/dropzone";
import { useCreateFromCV } from "@/api/mutations/candidates";
import { useState } from "react";

export function CreateFromCVButton() {
    const mutation = useCreateFromCV();
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
        
        mutation.mutate(selectedFile, {
            onSuccess: () => {
                setSelectedFile(null);
                setError(null);
                // Close dialog by triggering the trigger button
                const trigger = document.querySelector('[data-state="open"]') as HTMLElement;
                if (trigger) {
                    trigger.click();
                }
            },
            onError: (error: any) => {
                setError(error?.message || "Ошибка при загрузке файла");
            }
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
                    Загрузить резюме
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Загрузить резюме</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* File Drop Zone */}
                    <Dropzone
                        accept={{
                            "application/pdf": [".pdf"]
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
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                                <p className="text-sm font-medium text-green-700">
                                    {selectedFile?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(selectedFile?.size! / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </DropzoneContent>
                        
                        <DropzoneEmptyState>
                            <div className="space-y-2">
                                <UploadIcon className="w-8 h-8 text-muted-foreground mx-auto" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Перетащите PDF файл сюда или нажмите для выбора
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Максимальный размер: 10MB
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
                        disabled={!selectedFile || mutation.isPending}
                        className="w-full"
                    >
                        {mutation.isPending ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Загрузка...
                            </>
                        ) : (
                            <>
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Загрузить резюме
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
