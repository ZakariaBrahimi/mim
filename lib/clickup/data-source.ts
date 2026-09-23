import {
  ClickUpApiError,
  ClickUpConfigError,
  fetchAllLists,
  fetchTasksForLists,
  fetchWorkspaceMembers,
  isClickUpConfigured,
  resolveCurrentSprint,
} from "./client";
import { mapClickUpTasksToRoadmapItems } from "./mapper";
import { autoScheduleItems } from "./auto-schedule";
import { getQ4Window } from "../date-utils";
import { MEMBERS, MOCK_MILESTONES, MOCK_ROADMAP_ITEMS } from "./mock-data";
import type { DataSourceMeta, Member, Milestone, RoadmapItem, RoadmapView } from "../types";

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

const DEFAULT_BACKLOG_LIST_ID = "901212762115"; // "Product Backlog"
const DEFAULT_DESIGN_LIST_ID = "901213045864"; // "Design"

/**
 * Q4 roadmap: Product Backlog + whatever sprint is current, auto-scheduled
 * against the backlog's target quarter and the sprint's own two-week window
 * respectively, since most tickets in this workspace carry no dates at all.
 */
async function fetchQ4RoadmapItems(): Promise<RoadmapItem[]> {
  const backlogListId = process.env.CLICKUP_BACKLOG_LIST_ID || DEFAULT_BACKLOG_LIST_ID;
  const sprint = await resolveCurrentSprint();

  const listIds = [backlogListId, ...(sprint ? [sprint.id] : [])];
  const tasks = await fetchTasksForLists(listIds);
  const items = mapClickUpTasksToRoadmapItems(tasks);

  const q4 = getQ4Window();
  const sprintItems = sprint ? items.filter((i) => i.team === sprint.name) : [];
  const backlogItems = sprint ? items.filter((i) => i.team !== sprint.name) : items;

  const scheduledBacklog = autoScheduleItems(backlogItems, q4.start, q4.end);
  const scheduledSprint = sprint
    ? autoScheduleItems(sprintItems, sprint.start, sprint.end)
    : [];

  return [...scheduledBacklog, ...scheduledSprint];
}

/** Design roadmap: the Design list only, auto-scheduled into the target quarter. */
async function fetchDesignRoadmapItems(): Promise<RoadmapItem[]> {
  const designListId = process.env.CLICKUP_DESIGN_LIST_ID || DEFAULT_DESIGN_LIST_ID;
  const tasks = await fetchTasksForLists([designListId]);
  const items = mapClickUpTasksToRoadmapItems(tasks);
  const q4 = getQ4Window();
  return autoScheduleItems(items, q4.start, q4.end);
}

export async function getRoadmapItems(view: RoadmapView = "q4"): Promise<Result<RoadmapItem[]>> {
  if (!isClickUpConfigured()) {
    return {
      data: MOCK_ROADMAP_ITEMS,
      meta: mockMeta(
        "CLICKUP_API_TOKEN / CLICKUP_WORKSPACE_ID not set — serving seed data",
      ),
    };
  }

  try {
    const items = view === "design" ? await fetchDesignRoadmapItems() : await fetchQ4RoadmapItems();
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
