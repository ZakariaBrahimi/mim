import type {
  ClickUpList,
  ClickUpMember,
  ClickUpTask,
} from "./types";

const CLICKUP_BASE = "https://api.clickup.com/api/v2";

export class ClickUpConfigError extends Error {}
export class ClickUpApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getCredentials() {
  const token = process.env.CLICKUP_API_TOKEN;
  const workspaceId = process.env.CLICKUP_WORKSPACE_ID;
  if (!token || !workspaceId) {
    throw new ClickUpConfigError(
      "CLICKUP_API_TOKEN or CLICKUP_WORKSPACE_ID is not configured",
    );
  }
  return { token, workspaceId };
}

async function clickupFetch<T>(path: string): Promise<T> {
  const { token } = getCredentials();
  const res = await fetch(`${CLICKUP_BASE}${path}`, {
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    // ClickUp data changes frequently; always get fresh data server-side.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ClickUpApiError(
      `ClickUp API request failed (${res.status}): ${body}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

/** Returns true when the required env vars are present (does not validate the token itself). */
export function isClickUpConfigured(): boolean {
  return Boolean(
    process.env.CLICKUP_API_TOKEN && process.env.CLICKUP_WORKSPACE_ID,
  );
}

export async function fetchWorkspaceSpaces() {
  const { workspaceId } = getCredentials();
  const data = await clickupFetch<{ spaces: { id: string; name: string }[] }>(
    `/team/${workspaceId}/space`,
  );
  return data.spaces;
}

export async function fetchSpaceLists(spaceId: string): Promise<ClickUpList[]> {
  const data = await clickupFetch<{ lists: ClickUpList[] }>(
    `/space/${spaceId}/list`,
  );
  return data.lists;
}

export async function fetchSpaceFolders(spaceId: string) {
  const data = await clickupFetch<{ folders: { id: string; name: string }[] }>(
    `/space/${spaceId}/folder`,
  );
  return data.folders;
}

export async function fetchFolderLists(folderId: string): Promise<ClickUpList[]> {
  const data = await clickupFetch<{ lists: ClickUpList[] }>(
    `/folder/${folderId}/list`,
  );
  return data.lists;
}

/** Crawls every space, including lists nested inside folders. */
export async function fetchAllLists(): Promise<ClickUpList[]> {
  const spaces = await fetchWorkspaceSpaces();
  const perSpace = await Promise.all(
    spaces.map(async (s) => {
      const [topLevelLists, folders] = await Promise.all([
        fetchSpaceLists(s.id).catch(() => [] as ClickUpList[]),
        fetchSpaceFolders(s.id).catch(() => [] as { id: string; name: string }[]),
      ]);
      const folderLists = await Promise.all(
        folders.map((f) => fetchFolderLists(f.id).catch(() => [] as ClickUpList[])),
      );
      return [...topLevelLists, ...folderLists.flat()];
    }),
  );
  return perSpace.flat();
}

export async function fetchListTasks(listId: string): Promise<ClickUpTask[]> {
  const data = await clickupFetch<{ tasks: ClickUpTask[] }>(
    `/list/${listId}/task?include_closed=true&subtasks=false`,
  );
  return data.tasks;
}

export async function fetchTasksForLists(listIds: string[]): Promise<ClickUpTask[]> {
  const tasksByList = await Promise.all(
    listIds.map((id) => fetchListTasks(id).catch(() => [] as ClickUpTask[])),
  );
  return tasksByList.flat();
}

/**
 * List IDs to scope the sync to, via CLICKUP_LIST_IDS (comma-separated).
 * Scoping avoids crawling every sprint/backlog list in the workspace —
 * pointing this at your release/feature-planning lists keeps the roadmap to
 * scheduled, feature-level work instead of every raw dev ticket.
 */
export function getConfiguredListIds(): string[] | null {
  const raw = process.env.CLICKUP_LIST_IDS;
  if (!raw) return null;
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.length ? ids : null;
}

export async function fetchAllTasks(): Promise<ClickUpTask[]> {
  const configuredListIds = getConfiguredListIds();
  if (configuredListIds) return fetchTasksForLists(configuredListIds);

  const lists = await fetchAllLists();
  const tasksByList = await Promise.all(
    lists.map((l) => fetchListTasks(l.id).catch(() => [] as ClickUpTask[])),
  );
  return tasksByList.flat();
}

export async function fetchWorkspaceMembers(): Promise<ClickUpMember[]> {
  const { workspaceId } = getCredentials();
  const data = await clickupFetch<{
    team: { members: ClickUpMember[] };
  }>(`/team/${workspaceId}`);
  return data.team.members;
}
