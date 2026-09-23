"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoadmapItem, RoadmapView } from "@/lib/types";

interface UpdateDatesInput {
  id: string;
  startDate: string;
  dueDate: string;
}

export function useUpdateRoadmapItemDates(view: RoadmapView) {
  const queryClient = useQueryClient();
  const queryKey = ["clickup", "tasks", view];

  return useMutation({
    mutationFn: async ({ id, startDate, dueDate }: UpdateDatesInput) => {
      const res = await fetch(`/api/clickup/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, dueDate }),
      });
      if (!res.ok) throw new Error("Failed to update dates");
      return res.json();
    },
    onMutate: async ({ id, startDate, dueDate }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ items: RoadmapItem[] }>(queryKey);

      queryClient.setQueryData<{ items: RoadmapItem[] } | undefined>(
        queryKey,
        (old) =>
          old && {
            ...old,
            items: old.items.map((item) =>
              item.id === id ? { ...item, startDate, dueDate } : item,
            ),
          },
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}
