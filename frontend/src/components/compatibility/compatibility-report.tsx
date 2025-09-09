import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { compatibilityReportQueryOptions } from "@/api/queries/compatibility";

interface CompatibilityReportProps {
	candidateId: string;
	vacancyId: number;
}

export function CompatibilityReport({
	candidateId,
	vacancyId,
}: CompatibilityReportProps) {
	const {
		data: report,
		isLoading,
		error,
	} = useQuery(compatibilityReportQueryOptions(candidateId, vacancyId));

	if (isLoading) {
		return <CompatibilityReportSkeleton />;
	}

	if (error || !report) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Отчет о совместимости</CardTitle>
					<CardDescription>
						Не удалось сгенерировать отчет о совместимости
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-destructive">
						Ошибка загрузки отчета о совместимости
					</p>
				</CardContent>
			</Card>
		);
	}

	const getScoreColor = (score: string) => {
		const numScore = Number.parseInt(score.replace("%", ""));
		if (numScore >= 80) return "bg-green-500";
		if (numScore >= 65) return "bg-blue-500";
		if (numScore >= 45) return "bg-yellow-500";
		return "bg-red-500";
	};

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

	return (
		<div className="space-y-6">
			{/* Executive Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Краткое резюме
						<Badge
							className={getMatchLevelColor(
								report.executive_summary.match_level,
							)}
						>
							{report.executive_summary.match_level}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="text-3xl font-bold">
							{report.executive_summary.overall_match_score}
						</div>
						<div className="flex-1">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className={`h-2 rounded-full ${getScoreColor(report.executive_summary.overall_match_score)}`}
									style={{
										width: report.executive_summary.overall_match_score,
									}}
								/>
							</div>
						</div>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Рекомендация:</h4>
						<p className="text-sm text-muted-foreground">
							{report.executive_summary.recommendation}
						</p>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Ключевые преимущества:</h4>
						<ul className="list-disc list-inside space-y-1 text-sm">
							{report.executive_summary.key_strengths.map((strength) => (
								<li key={strength} className="text-green-700">
									{strength}
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Основные проблемы:</h4>
						<ul className="list-disc list-inside space-y-1 text-sm">
							{report.executive_summary.main_concerns.map((concern) => (
								<li key={concern} className="text-red-700">
									{concern}
								</li>
							))}
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* Candidate Profile */}
			<Card>
				<CardHeader>
					<CardTitle>Профиль кандидата</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<h4 className="font-semibold">Имя:</h4>
							<p className="text-sm text-muted-foreground">
								{report.candidate_profile.name}
							</p>
						</div>
						<div>
							<h4 className="font-semibold">Текущая должность:</h4>
							<p className="text-sm text-muted-foreground">
								{report.candidate_profile.current_position}
							</p>
						</div>
						<div>
							<h4 className="font-semibold">Уровень опыта:</h4>
							<p className="text-sm text-muted-foreground">
								{report.candidate_profile.experience_level}
							</p>
						</div>
						<div>
							<h4 className="font-semibold">Местоположение:</h4>
							<p className="text-sm text-muted-foreground">
								{report.candidate_profile.location}
							</p>
						</div>
						<div>
							<h4 className="font-semibold">Предпочитаемая занятость:</h4>
							<p className="text-sm text-muted-foreground">
								{report.candidate_profile.preferred_employment}
							</p>
						</div>
						<div>
							<h4 className="font-semibold">Контакт:</h4>
							<p className="text-sm text-muted-foreground">
								{report.candidate_profile.contact}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Detailed Analysis */}
			<Card>
				<CardHeader>
					<CardTitle>Детальный анализ навыков и опыта</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Skills Match */}
					<div>
						<h4 className="font-semibold mb-3">Анализ соответствия навыков</h4>
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">
									Процент соответствия:
								</span>
								<Badge variant="outline">
									{
										report.detailed_analysis.candidate_analysis.skills_match
											.matched_percentage
									}
									%
								</Badge>
							</div>

							<div>
								<h5 className="text-sm font-medium mb-1">
									Соответствующие ключевые навыки:
								</h5>
								<div className="flex flex-wrap gap-1">
									{report.detailed_analysis.candidate_analysis.skills_match.matched_core_skills.map(
										(skill) => (
											<Badge
												key={skill}
												variant="secondary"
												className="text-xs"
											>
												{skill}
											</Badge>
										),
									)}
								</div>
							</div>

							{report.detailed_analysis.candidate_analysis.skills_match
								.missing_critical_skills.length > 0 && (
								<div>
									<h5 className="text-sm font-medium mb-1 text-red-700">
										Отсутствующие критически важные навыки:
									</h5>
									<div className="flex flex-wrap gap-1">
										{report.detailed_analysis.candidate_analysis.skills_match.missing_critical_skills.map(
											(skill) => (
												<Badge
													key={skill}
													variant="destructive"
													className="text-xs"
												>
													{skill}
												</Badge>
											),
										)}
									</div>
								</div>
							)}

							{report.detailed_analysis.candidate_analysis.skills_match
								.bonus_skills_candidate_has.length > 0 && (
								<div>
									<h5 className="text-sm font-medium mb-1 text-green-700">
										Дополнительные навыки:
									</h5>
									<div className="flex flex-wrap gap-1">
										{report.detailed_analysis.candidate_analysis.skills_match.bonus_skills_candidate_has.map(
											(skill) => (
												<Badge
													key={skill}
													variant="outline"
													className="text-xs text-green-700 border-green-300"
												>
													{skill}
												</Badge>
											),
										)}
									</div>
								</div>
							)}

							<div>
								<h5 className="text-sm font-medium mb-1">
									Оценка пробелов в навыках:
								</h5>
								<p className="text-sm text-muted-foreground">
									{
										report.detailed_analysis.candidate_analysis.skills_match
											.skills_gap_assessment
									}
								</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* Experience Analysis */}
					<div>
						<h4 className="font-semibold mb-3">Анализ опыта</h4>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h5 className="text-sm font-medium">Релевантный опыт:</h5>
									<p className="text-sm text-muted-foreground">
										{
											report.detailed_analysis.candidate_analysis
												.experience_analysis.relevant_experience_years
										}{" "}
										лет
									</p>
								</div>
								<div>
									<h5 className="text-sm font-medium">Соответствие домену:</h5>
									<p className="text-sm text-muted-foreground">
										{
											report.detailed_analysis.candidate_analysis
												.experience_analysis.domain_match
										}
									</p>
								</div>
							</div>

							<div>
								<h5 className="text-sm font-medium">Карьерный рост:</h5>
								<p className="text-sm text-muted-foreground">
									{
										report.detailed_analysis.candidate_analysis
											.experience_analysis.role_progression
									}
								</p>
							</div>

							<div>
								<h5 className="text-sm font-medium">
									Соответствие уровню опыта:
								</h5>
								<Badge variant="outline">
									{
										report.detailed_analysis.candidate_analysis
											.experience_analysis.experience_level_fit
									}
								</Badge>
							</div>

							{report.detailed_analysis.candidate_analysis.experience_analysis
								.relevant_projects.length > 0 && (
								<div>
									<h5 className="text-sm font-medium">Релевантные проекты:</h5>
									<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
										{report.detailed_analysis.candidate_analysis.experience_analysis.relevant_projects.map(
											(project) => (
												<li key={project}>{project}</li>
											),
										)}
									</ul>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Potential Concerns */}
			<Card>
				<CardHeader>
					<CardTitle>Потенциальные проблемы</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc list-inside space-y-2">
						{report.potential_concerns.map((concern) => (
							<li key={concern} className="text-sm text-muted-foreground">
								{concern}
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			{/* Hiring Recommendation */}
			<Card>
				<CardHeader>
					<CardTitle>Рекомендация по найму</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm">{report.hiring_recommendation}</p>
				</CardContent>
			</Card>

			{/* Next Steps */}
			<Card>
				<CardHeader>
					<CardTitle>Рекомендуемые следующие шаги</CardTitle>
				</CardHeader>
				<CardContent>
					<ol className="list-decimal list-inside space-y-2">
						{report.next_steps.map((step) => (
							<li key={step} className="text-sm text-muted-foreground">
								{step}
							</li>
						))}
					</ol>
				</CardContent>
			</Card>
		</div>
	);
}

function CompatibilityReportSkeleton() {
	return (
		<div className="space-y-6">
				{Array.from({ length: 6 }, (_, i) => (
					<Card 
						// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton components
						key={`skeleton-${i}`}
					>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
