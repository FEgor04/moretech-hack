import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { topVacanciesForCandidateQueryOptions } from "@/api/queries/compatibility";
import { Link } from "@tanstack/react-router";

interface SimilarVacanciesProps {
	candidateId: string;
	limit?: number;
}

export function SimilarVacancies({
	candidateId,
	limit = 10,
}: SimilarVacanciesProps) {
	const {
		data: vacancies,
		isLoading,
		error,
	} = useQuery(topVacanciesForCandidateQueryOptions(candidateId, limit));

	if (isLoading) {
		return <SimilarVacanciesSkeleton />;
	}

	if (error || !vacancies) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Лучшие подходящие вакансии</CardTitle>
					<CardDescription>
						Не удалось загрузить подходящие вакансии
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-destructive">
						Ошибка загрузки подходящих вакансий
					</p>
				</CardContent>
			</Card>
		);
	}

	const getMatchLevelColor = (level: string) => {
		switch (level) {
			case "Отличное совпадение":
				return "bg-green-100 text-green-800 border-green-200";
			case "Хорошее совпадение":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "Удовлетворительное совпадение":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "Плохое совпадение":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 65) return "text-blue-600";
		if (score >= 45) return "text-yellow-600";
		return "text-red-600";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Лучшие подходящие вакансии</CardTitle>
				<CardDescription>
					Вакансии, которые лучше всего соответствуют профилю этого кандидата
				</CardDescription>
			</CardHeader>
			<CardContent>
				{vacancies.length === 0 ? (
					<p className="text-muted-foreground text-center py-8">
						Подходящие вакансии не найдены. Сгенерируйте эмбеддинги для
						просмотра совпадений.
					</p>
				) : (
					<div className="space-y-4">
						{vacancies.map((vacancy) => (
							<div
								key={vacancy.vacancy_id}
								className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 space-y-2">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold">{vacancy.title}</h3>
											<Badge
												className={getMatchLevelColor(vacancy.match_level)}
											>
												{vacancy.match_level}
											</Badge>
										</div>

										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											{vacancy.company && (
												<span>Компания: {vacancy.company}</span>
											)}
											{vacancy.location && (
												<span>Местоположение: {vacancy.location}</span>
											)}
											{vacancy.domain && <span>Домен: {vacancy.domain}</span>}
										</div>

										<div className="flex items-center gap-4 text-sm">
											{vacancy.employment_type && (
												<Badge variant="outline">
													{vacancy.employment_type}
												</Badge>
											)}
											{vacancy.experience_level && (
												<Badge variant="outline">
													{vacancy.experience_level}
												</Badge>
											)}
										</div>
									</div>

									<div className="flex flex-col items-end gap-2">
										{(() => {
											const value =
												vacancy.overall_score ?? vacancy.similarity_score;
											return (
												<div
													className={`text-2xl font-bold ${getScoreColor(value)}`}
												>
													{value.toFixed(2)}%
												</div>
											);
										})()}
										<div className="flex gap-2">
											<Button asChild size="sm">
												<Link
													to="/vacancies/$vacancyId"
													params={{ vacancyId: vacancy.vacancy_id.toString() }}
												>
													Просмотр деталей
												</Link>
											</Button>
											<Button asChild size="sm" variant="outline">
												<Link
													to="/compatibility/$candidateId/$vacancyId"
													params={{
														candidateId: candidateId,
														vacancyId: vacancy.vacancy_id.toString(),
													}}
												>
													Анализ
												</Link>
											</Button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function SimilarVacanciesSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-64" />
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{Array.from({ length: 3 }, (_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton components
							key={`skeleton-vacancy-${i}`}
							className="border rounded-lg p-4"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-48" />
									<div className="flex gap-4">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-28" />
									</div>
									<div className="flex gap-2">
										<Skeleton className="h-6 w-20" />
										<Skeleton className="h-6 w-16" />
									</div>
								</div>
								<div className="flex flex-col items-end gap-2">
									<Skeleton className="h-8 w-12" />
									<Skeleton className="h-8 w-20" />
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
