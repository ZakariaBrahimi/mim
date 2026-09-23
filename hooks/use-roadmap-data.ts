"use client";

import { useQuery } from "@tanstack/react-query";
import type { DataSourceMeta, Member, Milestone, RoadmapItem } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request to ${url} failed with ${res.status}`);
  return res.json();
}

export function useRoadmapItems() {
  return useQuery({
    queryKey: ["clickup", "tasks"],
    queryFn: () =>
      fetchJson<{ items: RoadmapItem[]; meta: DataSourceMeta }>("/api/clickup/tasks"),
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
