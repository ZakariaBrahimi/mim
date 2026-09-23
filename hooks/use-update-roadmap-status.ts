"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Comment, RoadmapItem, RoadmapStatus } from "@/lib/types";

export function useUpdateRoadmapItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RoadmapStatus }) => {
      const res = await fetch(`/api/clickup/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["clickup", "tasks"] });
      const previous = queryClient.getQueryData<{ items: RoadmapItem[] }>([
        "clickup",
        "tasks",
      ]);
      queryClient.setQueryData<{ items: RoadmapItem[] } | undefined>(
        ["clickup", "tasks"],
        (old) =>
          old && {
            ...old,
            items: old.items.map((item) => (item.id === id ? { ...item, status } : item)),
          },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["clickup", "tasks"], context.previous);
    },
  });
}

export function useAddRoadmapComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      // No backend persistence layer (no database) — comment is appended
      // client-side to the cached item for this session.
      const comment: Comment = {
        id: `local-${Date.now()}`,
        author: "Rayen M.",
        text,
        createdAt: new Date().toISOString(),
      };
      return { id, comment };
    },
    onSuccess: ({ id, comment }) => {
      queryClient.setQueryData<{ items: RoadmapItem[] } | undefined>(
        ["clickup", "tasks"],
        (old) =>
          old && {
            ...old,
            items: old.items.map((item) =>
              item.id === id ? { ...item, comments: [...item.comments, comment] } : item,
            ),
          },
      );
    },
  });
}
