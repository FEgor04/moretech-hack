import { useSuspenseQuery } from "@tanstack/react-query";
import { interviewsByCandidateQueryOptions } from "@/api/queries/interviews";
import { Badge } from "@/components/ui/badge";
import { RelativeTimeTooltip } from "@/components/ui/relative-time-tooltip";

interface InterviewsListProps {
  candidateId: string;
}

export function InterviewsList({ candidateId }: InterviewsListProps) {
  const interviews = useSuspenseQuery(interviewsByCandidateQueryOptions(candidateId));

  if (interviews.data.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        <p>Интервью не запланированы</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Интервью</h3>
      <div className="space-y-3">
        {interviews.data.map((interview: any) => (
          <div
            key={interview.id}
            className="rounded-lg border p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {interview.status || "на собеседовании"}
                </Badge>
                {interview.vacancy_id && (
                  <Badge variant="outline">
                    Вакансия #{interview.vacancy_id}
                  </Badge>
                )}
              </div>
              <RelativeTimeTooltip date={interview.created_at} />
            </div>
            {interview.transcript && (
              <p className="text-sm text-muted-foreground">
                Транскрипт: {interview.transcript}
              </p>
            )}
            {interview.recording_url && (
              <a
                href={interview.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Запись интервью
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
