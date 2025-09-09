import { queryOptions } from "@tanstack/react-query";

// Note: These will need to be added to the generated client after running openapi-ts
// For now, we'll create manual API calls

export interface CompatibilityReport {
	executive_summary: {
		overall_match_score: string;
		match_level: string;
		recommendation: string;
		key_strengths: string[];
		main_concerns: string[];
	};
	candidate_profile: {
		name: string;
		current_position: string;
		experience_level: string;
		location: string;
		preferred_employment: string;
		contact: string;
	};
	detailed_analysis: {
		candidate_analysis: {
			skills_match: {
				matched_core_skills: string[];
				matched_percentage: number;
				missing_critical_skills: string[];
				bonus_skills_candidate_has: string[];
				skills_gap_assessment: string;
			};
			experience_analysis: {
				relevant_experience_years: number;
				domain_match: string;
				role_progression: string;
				relevant_projects: string[];
				experience_level_fit: string;
			};
		};
	};
	potential_concerns: string[];
	hiring_recommendation: string;
	next_steps: string[];
}

export interface SimilarVacancy {
	vacancy_id: number;
	title: string;
	company: string | null;
	location: string | null;
	domain: string | null;
	employment_type: string | null;
	experience_level: string | null;
	similarity_score: number;
	overall_score?: number;
	match_level: string;
}

export interface SimilarCandidate {
	candidate_id: string;
	name: string;
	position: string;
	email: string | null;
	geo: string | null;
	employment_type: string | null;
	similarity_score: number;
	overall_score?: number;
	match_level: string;
}

export const compatibilityReportQueryOptions = (
	candidateId: string,
	vacancyId: number,
) =>
	queryOptions({
		queryKey: ["compatibility", "report", candidateId, vacancyId],
		queryFn: async (): Promise<CompatibilityReport> => {
			const response = await fetch(
				`/api/compatibility/candidate/${candidateId}/vacancy/${vacancyId}/report`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch compatibility report");
			}
			return response.json();
		},
		enabled: Boolean(candidateId && vacancyId),
	});

export const topVacanciesForCandidateQueryOptions = (
	candidateId: string,
	limit = 10,
) =>
	queryOptions({
		queryKey: ["compatibility", "top-vacancies", candidateId, limit],
		queryFn: async (): Promise<SimilarVacancy[]> => {
			const response = await fetch(
				`/api/compatibility/candidate/${candidateId}/top-vacancies?limit=${limit}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch top vacancies");
			}
			return response.json();
		},
		enabled: Boolean(candidateId),
	});

export const topCandidatesForVacancyQueryOptions = (
	vacancyId: number,
	limit = 10,
) =>
	queryOptions({
		queryKey: ["compatibility", "top-candidates", vacancyId, limit],
		queryFn: async (): Promise<SimilarCandidate[]> => {
			const response = await fetch(
				`/api/compatibility/vacancy/${vacancyId}/top-candidates?limit=${limit}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch top candidates");
			}
			return response.json();
		},
		enabled: Boolean(vacancyId),
	});
