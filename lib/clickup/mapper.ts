import type { ClickUpCustomField, ClickUpTask } from "./types";
import type {
  Priority,
  RoadmapItem,
  RoadmapStatus,
  ProductKey,
} from "../types";

/**
 * MizaniyaPay's ClickUp workspace categorizes tasks with a workspace-level
 * "Product" dropdown custom field rather than one space per product. These
 * are the field's real option names (confirmed against the live workspace).
 */
const PRODUCT_FIELD_TO_KEY: Record<string, ProductKey> = {
  admin: "admin",
  "client app": "mobile",
  partner: "partner",
  market: "market",
  "market admin": "market_admin",
  website: "website",
  "payment gataway": "gateway", // typo present in the live ClickUp field option
  "payment gateway": "gateway",
  mtp: "mtp",
};

const STATUS_MAP: Record<string, RoadmapStatus> = {
  backlog: "backlog",
  "to do": "todo",
  todo: "todo",
  open: "todo",
  draft: "backlog",
  "needs refinement": "backlog",
  "ready for planning": "backlog",
  planned: "todo",
  "in progress": "in_progress",
  "in review": "review",
  review: "review",
  "qa testing": "qa_testing",
  qa: "qa_testing",
  testing: "qa_testing",
  "ready for deployment": "ready_deployment",
  "ready deployment": "ready_deployment",
  staging: "ready_deployment",
  production: "production",
  done: "production",
  complete: "production",
  closed: "production",
  blocked: "blocked",
};

/** Statuses that mean a task is no longer relevant to the roadmap at all. */
const EXCLUDED_STATUSES = new Set(["canceled", "cancelled"]);

export function mapClickUpStatus(status: string): RoadmapStatus {
  return STATUS_MAP[status.trim().toLowerCase()] ?? "backlog";
}

export function mapClickUpPriority(
  priority: ClickUpTask["priority"],
): Priority {
  if (!priority) return "medium";
  const p = priority.priority.toLowerCase();
  if (p === "urgent" || p === "high") return "high";
  if (p === "low") return "low";
  return "medium";
}

function findCustomField(
  task: ClickUpTask,
  name: string,
): ClickUpCustomField | undefined {
  return task.custom_fields.find(
    (f) => f.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
}

/**
 * Resolves a dropdown/label custom field's selected option to its name.
 * ClickUp represents the selection either as the option's orderindex
 * (legacy dropdowns) or its UUID (new_drop_down fields) — this handles both.
 */
function resolveDropdownOptionName(field: ClickUpCustomField): string | null {
  const options = field.type_config?.options ?? [];
  if (field.value == null) return null;

  if (typeof field.value === "string") {
    const byId = options.find((o) => (o as { id?: string }).id === field.value);
    if (byId) return byId.name;
  }

  if (typeof field.value === "number") {
    const byIndex = options.find((o) => o.orderindex === field.value);
    if (byIndex) return byIndex.name;
  }

  return null;
}

export function getProductFromTask(task: ClickUpTask): ProductKey | null {
  const field = findCustomField(task, "Product");
  if (!field) return null;
  const optionName = resolveDropdownOptionName(field);
  if (!optionName) return null;
  return PRODUCT_FIELD_TO_KEY[optionName.trim().toLowerCase()] ?? null;
}

function getReleaseVersion(task: ClickUpTask): string | undefined {
  const field = findCustomField(task, "Release Version");
  if (!field || typeof field.value !== "string") return undefined;
  return field.value.trim() || undefined;
}

/**
 * Roadmap eligibility: the task must be tagged with a recognized "Product"
 * value and have a due date to place on the timeline (MizaniyaPay's ClickUp
 * tasks are granular dev tickets, most without dates — only the subset the
 * team has actually scheduled belongs on a delivery roadmap).
 */
export function isRoadmapEligible(task: ClickUpTask): boolean {
  if (EXCLUDED_STATUSES.has(task.status.status.trim().toLowerCase())) return false;
  if (!getProductFromTask(task)) return false;
  return Boolean(task.due_date);
}

function toIsoDate(ms: string | null | undefined): string | null {
  if (!ms) return null;
  const n = Number(ms);
  if (Number.isNaN(n)) return null;
  return new Date(n).toISOString();
}

const DEFAULT_DURATION_DAYS = 10;

export function mapClickUpTaskToRoadmapItem(
  task: ClickUpTask,
): RoadmapItem | null {
  const product = getProductFromTask(task);
  if (!product) return null;

  const due = toIsoDate(task.due_date);
  if (!due) return null;

  // Most tasks in this workspace only have a due date — fall back to a
  // default lead time so the Gantt bar still has a sensible width.
  const start =
    toIsoDate(task.start_date) ??
    new Date(
      new Date(due).getTime() - DEFAULT_DURATION_DAYS * 86_400_000,
    ).toISOString();

  const assignee = task.assignees[0];

  return {
    id: `cu-${task.id}`,
    clickupTaskId: task.id,
    clickupUrl: task.url,
    title: task.name,
    description: task.text_content ?? task.description ?? "",
    businessGoal: "",
    product,
    team: task.list.name,
    owner: assignee
      ? {
          id: String(assignee.id),
          name: assignee.username,
          initials: assignee.username
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          color: assignee.color ?? "#6366f1",
          team: task.list.name,
        }
      : {
          id: "unassigned",
          name: "Unassigned",
          initials: "—",
          color: "#94a3b8",
          team: task.list.name,
        },
    status: mapClickUpStatus(task.status.status),
    priority: mapClickUpPriority(task.priority),
    progress:
      task.status.type === "closed" || task.status.type === "done"
        ? 100
        : Math.max(5, Math.min(90, task.status.orderindex * 15)),
    startDate: start,
    dueDate: due,
    version: getReleaseVersion(task),
    taskCount: 1,
    tasks: [
      {
        id: task.id,
        name: task.name,
        status: mapClickUpStatus(task.status.status),
        assignee: assignee?.username,
        dueDate: due,
        url: task.url,
      },
    ],
    comments: [],
    attachments: [],
    dependencies: [],
    isMock: false,
  };
}

export function mapClickUpTasksToRoadmapItems(
  tasks: ClickUpTask[],
): RoadmapItem[] {
  return tasks
    .filter(isRoadmapEligible)
    .map(mapClickUpTaskToRoadmapItem)
    .filter((item): item is RoadmapItem => item !== null);
}
