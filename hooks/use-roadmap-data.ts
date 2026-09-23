"use client";

import { useQuery } from "@tanstack/react-query";
import type { DataSourceMeta, Member, Milestone, RoadmapItem, RoadmapView } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request to ${url} failed with ${res.status}`);
  return res.json();
}

export function useRoadmapItems(view: RoadmapView = "q4") {
  return useQuery({
    queryKey: ["clickup", "tasks", view],
    queryFn: () =>
      fetchJson<{ items: RoadmapItem[]; meta: DataSourceMeta }>(
        `/api/clickup/tasks?view=${view}`,
      ),
  });
}

export function useMilestones() {
  return useQuery({
    queryKey: ["clickup", "milestones"],
    queryFn: () =>
      fetchJson<{ milestones: Milestone[]; meta: DataSourceMeta }>(
        "/api/clickup/milestones",
      ),
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ["clickup", "members"],
    queryFn: () =>
      fetchJson<{ members: Member[]; meta: DataSourceMeta }>("/api/clickup/members"),
  });
}
