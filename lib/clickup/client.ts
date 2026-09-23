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

export async function fetchAllLists(): Promise<ClickUpList[]> {
  const spaces = await fetchWorkspaceSpaces();
  const lists = await Promise.all(
    spaces.map((s) => fetchSpaceLists(s.id).catch(() => [] as ClickUpList[])),
  );
  return lists.flat();
}

export async function fetchListTasks(listId: string): Promise<ClickUpTask[]> {
  const data = await clickupFetch<{ tasks: ClickUpTask[] }>(
    `/list/${listId}/task?include_closed=true&subtasks=false`,
  );
  return data.tasks;
}

export async function fetchAllTasks(): Promise<ClickUpTask[]> {
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
