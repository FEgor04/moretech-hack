import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInterviewInterviewsPost } from "../client";

export interface CreateInterviewData {
  candidate_id: string;
  vacancy_id?: number;
  status?: string;
}

export function useCreateInterviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInterviewData) => {
      const response = await createInterviewInterviewsPost<true>({
        body: data,
        throwOnError: true,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch interviews queries
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}
