import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { FileText, Search, Video, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<div className="min-h-screen bg-white">
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
							ИИ-Помощник для HR
						</h1>
						<p className="text-xl md:text-2xl mb-8 text-gray-600 max-w-3xl mx-auto">
							Революционизируйте процесс найма с помощью интеллектуального
							отбора кандидатов, автоматического анализа резюме и
							ИИ-собеседований
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button asChild size="lg">
								<Link to="/sign-in">Начать работу</Link>
							</Button>
							<Button variant="outline" size="lg">
								Смотреть демо
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Оптимизируйте процесс найма
						</h2>
						<p className="text-xl text-blue-100 max-w-2xl mx-auto">
							Наша ИИ-платформа оптимизирует каждый этап отбора кандидатов, от
							анализа резюме до финальных собеседований
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						<div className="text-center p-6 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
							<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
								<FileText className="w-8 h-8 text-blue-600" />
							</div>
							<h3 className="text-xl font-semibold mb-4">Анализ резюме</h3>
							<p className="text-blue-100">
								Автоматически парсим и анализируем резюме для извлечения
								ключевых навыков, опыта и квалификации
							</p>
						</div>

						<div className="text-center p-6 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
							<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
								<Search className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="text-xl font-semibold mb-4">
								Умное сопоставление
							</h3>
							<p className="text-blue-100">
								ИИ-сопоставление кандидатов на основе требований вакансии и
								анализа совместимости
							</p>
						</div>

						<div className="text-center p-6 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
							<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
								<Video className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="text-xl font-semibold mb-4">ИИ-собеседования</h3>
							<p className="text-blue-100">
								Проводите интеллектуальные видео-собеседования с динамической
								адаптацией вопросов и анализом в реальном времени
							</p>
						</div>

						<div className="text-center p-6 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
							<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
								<BarChart3 className="w-8 h-8 text-orange-600" />
							</div>
							<h3 className="text-xl font-semibold mb-4">
								Аналитика и инсайты
							</h3>
							<p className="text-blue-100">
								Получайте детальную аналитику по производительности кандидатов и
								эффективности воронки найма
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Как это работает
						</h2>
						<p className="text-xl text-gray-600">
							Простой, эффективный и интеллектуальный процесс найма
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
								<span className="text-2xl font-bold text-white">1</span>
							</div>
							<h3 className="text-xl font-semibold mb-4 text-gray-900">
								Загрузка и анализ
							</h3>
							<p className="text-gray-600">
								Загружайте описания вакансий и резюме кандидатов. Наш ИИ
								анализирует совместимость и извлекает ключевую информацию.
							</p>
						</div>

						<div className="text-center">
							<div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
								<span className="text-2xl font-bold text-white">2</span>
							</div>
							<h3 className="text-xl font-semibold mb-4 text-gray-900">
								ИИ-собеседование
							</h3>
							<p className="text-gray-600">
								Кандидаты участвуют в интеллектуальных видео-собеседованиях с
								динамическими вопросами, адаптированными к их ответам.
							</p>
						</div>

						<div className="text-center">
							<div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
								<span className="text-2xl font-bold text-white">3</span>
							</div>
							<h3 className="text-xl font-semibold mb-4 text-gray-900">
								Умные решения
							</h3>
							<p className="text-gray-600">
								Получайте ИИ-рекомендации с прозрачной логикой для принятия
								обоснованных решений о найме.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
				<div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl md:text-4xl font-bold mb-6">
						Готовы трансформировать процесс найма?
					</h2>
					<p className="text-xl text-green-100 mb-8">
						Присоединяйтесь к прогрессивным HR-командам, которые уже используют
						ИИ для поиска лучших кандидатов быстрее и эффективнее.
					</p>
					<Button asChild size="lg" variant="secondary" className="text-lg">
						<Link to="/sign-in">Начать бесплатный пробный период</Link>
					</Button>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-white py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<p className="text-gray-600">
							© 2024 ИИ-Помощник для HR. Революционизируем рекрутинг с помощью
							искусственного интеллекта.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
