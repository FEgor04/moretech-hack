import { useInitializeFirstMessageMutation } from "@/api/mutations/interviews";
import { candidateQueryOptions } from "@/api/queries/candidates";
import { interviewQueryOptions } from "@/api/queries/interviews";
import { vacancyQueryOptions } from "@/api/queries/vacancies";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Clock, FileText, MessageCircle, Play } from "lucide-react";
import { Button } from "../ui/button";
import Webcam from "react-webcam";
import { Badge } from "../ui/badge";

export function StartInterview({
	interviewId,
}: { interviewId: string}) {
	const interview = useSuspenseQuery(interviewQueryOptions(interviewId));
	const candidate = useSuspenseQuery(
		candidateQueryOptions(interview.data.candidate_id),
	);
	const vacancy = interview.data.vacancy_id
		? useSuspenseQuery(vacancyQueryOptions(interview.data.vacancy_id))
		: null;

	const initializeFirstMessageMutation = useInitializeFirstMessageMutation();

	const handleStartInterview = () => {
		initializeFirstMessageMutation.mutate(interviewId, {
			onSuccess: () => {
				toast.success("Собеседование началось!");
			},
			onError: (error) => {
				toast.error("Ошибка при запуске собеседования");
				console.error("Failed to initialize first message:", error);
			},
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">
						Добро пожаловать на собеседование!
					</h1>
					<p className="text-xl text-gray-600">
						Здравствуйте,{" "}
						<span className="font-semibold text-indigo-600">
							{candidate.data.name}
						</span>
						!
					</p>
				</div>

				{/* Main Content */}
				<div className="grid grid-cols-1 gap-6">
					{/* Interview Info Card */}
					<div className="">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MessageCircle className="h-6 w-6 text-indigo-600" />
									Информация о собеседовании
								</CardTitle>
								<CardDescription>
									Подробная информация о формате и процессе собеседования
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{vacancy && (
									<div>
										<h3 className="font-semibold text-lg mb-2">Позиция</h3>
										<div className="flex items-center gap-2 mb-2">
											<Badge variant="secondary" className="text-sm">
												{vacancy.data.title}
											</Badge>
										</div>
										{vacancy.data.description && (
											<p className="text-gray-600 text-sm whitespace-pre-line">
												{vacancy.data.description}
											</p>
										)}
									</div>
								)}

								<div>
									<h3 className="font-semibold text-lg mb-3">
										Формат собеседования
									</h3>
									<div className="space-y-3">
										<div className="flex items-start gap-3">
											<div className="bg-indigo-100 p-2 rounded-lg">
												<MessageCircle className="h-5 w-5 text-indigo-600" />
											</div>
											<div>
												<h4 className="font-medium">Интерактивный чат</h4>
												<p className="text-sm text-gray-600">
													Собеседование проходит в формате диалога с
													ИИ-ассистентом
												</p>
											</div>
										</div>

										<div className="flex items-start gap-3">
											<div className="bg-green-100 p-2 rounded-lg">
												<Clock className="h-5 w-5 text-green-600" />
											</div>
											<div>
												<h4 className="font-medium">Гибкое время</h4>
												<p className="text-sm text-gray-600">
													Вы можете проходить собеседование в удобное для вас
													время
												</p>
											</div>
										</div>

										<div className="flex items-start gap-3">
											<div className="bg-purple-100 p-2 rounded-lg">
												<FileText className="h-5 w-5 text-purple-600" />
											</div>
											<div>
												<h4 className="font-medium">Автоматическая оценка</h4>
												<p className="text-sm text-gray-600">
													Ваши ответы будут проанализированы системой ИИ
												</p>
											</div>
										</div>
									</div>
								</div>

								<div className="bg-blue-50 p-4 rounded-lg">
									<h4 className="font-semibold text-blue-900 mb-2">
										Что ожидать:
									</h4>
									<ul className="text-sm text-blue-800 space-y-1">
										<li>• Вопросы будут касаться вашего опыта и навыков</li>
										<li>• Отвечайте честно и подробно</li>
										<li>• Не торопитесь, обдумайте каждый ответ</li>
										<li>• Вы можете задавать уточняющие вопросы</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Start Interview Card */}
					<div>
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Play className="h-6 w-6 text-green-600" />
									Начать собеседование
								</CardTitle>
								<CardDescription>
									Готовы начать? Нажмите кнопку ниже
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col justify-center h-full">
								<div className="text-center space-y-4">
									<Webcam
										muted
										audio={true}
										onUserMedia={(media) => {
											console.log("User media", media);
										}}
									/>

									<div>
										<h3 className="font-semibold text-lg mb-2">Всё готово!</h3>
										<p className="text-sm text-gray-600 mb-6">
											Когда будете готовы, нажмите кнопку "Начать собеседование"
										</p>
									</div>

									<Button
										onClick={handleStartInterview}
										disabled={initializeFirstMessageMutation.isPending}
										size="lg"
										className="w-full bg-green-600 hover:bg-green-700 text-white"
									>
										{initializeFirstMessageMutation.isPending ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
												Запуск...
											</>
										) : (
											<>
												<Play className="h-4 w-4 mr-2" />
												Начать собеседование
											</>
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Footer Info */}
				<div className="mt-8 text-center">
					<p className="text-sm text-gray-500">
						Если у вас возникли технические проблемы, обратитесь к
						администратору
					</p>
				</div>
			</div>
		</div>
	);
}
