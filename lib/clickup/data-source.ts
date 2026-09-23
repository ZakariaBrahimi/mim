import {
  ClickUpApiError,
  ClickUpConfigError,
  fetchAllLists,
  fetchAllTasks,
  fetchWorkspaceMembers,
  isClickUpConfigured,
} from "./client";
import { mapClickUpTasksToRoadmapItems } from "./mapper";
import { MEMBERS, MOCK_MILESTONES, MOCK_ROADMAP_ITEMS } from "./mock-data";
import type { DataSourceMeta, Member, Milestone, RoadmapItem } from "../types";

interface Result<T> {
  data: T;
  meta: DataSourceMeta;
}

function mockMeta(reason: string): DataSourceMeta {
  return { mode: "mock", reason, fetchedAt: new Date().toISOString() };
}

function liveMeta(): DataSourceMeta {
  return { mode: "live", fetchedAt: new Date().toISOString() };
}

export async function getRoadmapItems(): Promise<Result<RoadmapItem[]>> {
  if (!isClickUpConfigured()) {
    return {
      data: MOCK_ROADMAP_ITEMS,
      meta: mockMeta(
        "CLICKUP_API_TOKEN / CLICKUP_WORKSPACE_ID not set — serving seed data",
      ),
    };
  }

  try {
    const tasks = await fetchAllTasks();
    const items = mapClickUpTasksToRoadmapItems(tasks);
    return { data: items, meta: liveMeta() };
  } catch (err) {
    const reason =
      err instanceof ClickUpConfigError || err instanceof ClickUpApiError
        ? err.message
        : "Unexpected error reaching ClickUp — serving seed data";
    return { data: MOCK_ROADMAP_ITEMS, meta: mockMeta(reason) };
  }
}

export async function getLists() {
  if (!isClickUpConfigured()) {
    return {
      data: [],
      meta: mockMeta(
        "CLICKUP_API_TOKEN / CLICKUP_WORKSPACE_ID not set — no live lists available",
      ),
    };
  }
  try {
    const lists = await fetchAllLists();
    return { data: lists, meta: liveMeta() };
  } catch (err) {
    const reason =
      err instanceof ClickUpConfigError || err instanceof ClickUpApiError
        ? err.message
        : "Unexpected error reaching ClickUp";
    return { data: [], meta: mockMeta(reason) };
  }
}

export async function getMilestones(): Promise<Result<Milestone[]>> {
  // Milestones are derived from roadmap items flagged as releases; ClickUp has
  // no native "milestone" object, so we keep curated milestones alongside
  // whatever live roadmap data resolves to.
  if (!isClickUpConfigured()) {
    return {
      data: MOCK_MILESTONES,
      meta: mockMeta(
        "CLICKUP_API_TOKEN / CLICKUP_WORKSPACE_ID not set — serving seed milestones",
      ),
    };
  }
  return { data: MOCK_MILESTONES, meta: liveMeta() };
}

export async function getMembers(): Promise<Result<Member[]>> {
  if (!isClickUpConfigured()) {
    return {
      data: MEMBERS,
      meta: mockMeta(
        "CLICKUP_API_TOKEN / CLICKUP_WORKSPACE_ID not set — serving seed members",
      ),
    };
  }
  try {
    const members = await fetchWorkspaceMembers();
    const mapped: Member[] = members.map((m) => ({
      id: String(m.user.id),
      name: m.user.username,
      initials: m.user.username
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      color: m.user.color ?? "#6366f1",
      team: "—",
    }));
    return { data: mapped, meta: liveMeta() };
  } catch (err) {
    const reason =
      err instanceof ClickUpConfigError || err instanceof ClickUpApiError
        ? err.message
        : "Unexpected error reaching ClickUp — serving seed members";
    return { data: MEMBERS, meta: mockMeta(reason) };
  }
}
