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
import { topCandidatesForVacancyQueryOptions } from "@/api/queries/compatibility";
import { Link } from "@tanstack/react-router";

interface SimilarCandidatesProps {
	vacancyId: number;
	limit?: number;
}

export function SimilarCandidates({
	vacancyId,
	limit = 10,
}: SimilarCandidatesProps) {
	const {
		data: candidates,
		isLoading,
		error,
	} = useQuery(topCandidatesForVacancyQueryOptions(vacancyId, limit));

	if (isLoading) {
		return <SimilarCandidatesSkeleton />;
	}

	if (error || !candidates) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Лучшие подходящие кандидаты</CardTitle>
					<CardDescription>
						Не удалось загрузить подходящих кандидатов
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-destructive">
						Ошибка загрузки подходящих кандидатов
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
				<CardTitle>Лучшие подходящие кандидаты</CardTitle>
				<CardDescription>
					Кандидаты, которые лучше всего соответствуют требованиям этой вакансии
				</CardDescription>
			</CardHeader>
			<CardContent>
				{candidates.length === 0 ? (
					<p className="text-muted-foreground text-center py-8">
						Подходящие кандидаты не найдены. Сгенерируйте эмбеддинги для
						просмотра совпадений.
					</p>
				) : (
					<div className="space-y-4">
						{candidates.map((candidate) => (
							<div
								key={candidate.candidate_id}
								className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1 space-y-2">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold">{candidate.name}</h3>
											<Badge
												className={getMatchLevelColor(candidate.match_level)}
											>
												{candidate.match_level}
											</Badge>
										</div>

										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span>Должность: {candidate.position}</span>
											{candidate.geo && (
												<span>Местоположение: {candidate.geo}</span>
											)}
											{candidate.email && <span>Email: {candidate.email}</span>}
										</div>

										{candidate.employment_type && (
											<div>
												<Badge variant="outline">
													{candidate.employment_type}
												</Badge>
											</div>
										)}
									</div>

									<div className="flex flex-col items-end gap-2">
										{(() => {
											const value =
												candidate.overall_score ?? candidate.similarity_score;
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
													to="/candidates/$candidateId"
													params={{ candidateId: candidate.candidate_id }}
												>
													Просмотр профиля
												</Link>
											</Button>
											<Button asChild size="sm" variant="outline">
												<Link
													to="/compatibility/$candidateId/$vacancyId"
													params={{
														candidateId: candidate.candidate_id,
														vacancyId: vacancyId.toString(),
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

function SimilarCandidatesSkeleton() {
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
							key={`skeleton-candidate-${i}`}
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
									<Skeleton className="h-6 w-20" />
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
