import type { ClickUpCustomField, ClickUpTask } from "./types";
import type {
  Priority,
  RoadmapItem,
  RoadmapStatus,
  ProductKey,
} from "../types";

/**
 * MizaniyaPay's ClickUp workspace categorizes tasks with a workspace-level
 * "Product" dropdown field (Admin, Client App, Partner, Market, Market
 * Admin, Website, Payment Gataway, MTP) rather than one Space per product.
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

/**
 * Fallback when the Product field isn't resolvable on a task (backlog/
 * sprint/design tickets don't reliably carry it): MizaniyaPay's task titles
 * consistently follow "[Type] - Product - description", so we parse the
 * product out of the title instead of dropping the task from the roadmap.
 * Ordered most-specific first.
 */
const TITLE_PRODUCT_PATTERNS: [RegExp, ProductKey][] = [
  [/market\s*admin/i, "market_admin"],
  [/payment\s*gat[ea]way/i, "gateway"],
  [/\bvtpe\b/i, "gateway"],
  [/\bwebsite\b/i, "website"],
  [/\bmerchant\b/i, "partner"],
  [/\bpartner\b/i, "partner"],
  [/\bmtp\b/i, "mtp"],
  [/\badmin\b/i, "admin"],
  [/\bagents?\b/i, "agents"],
  [/\bmarket\b/i, "market"],
  [/\bmobile\b/i, "mobile"],
];

function inferProductFromTitle(title: string): ProductKey {
  for (const [pattern, key] of TITLE_PRODUCT_PATTERNS) {
    if (pattern.test(title)) return key;
  }
  return "general";
}

const STATUS_MAP: Record<string, RoadmapStatus> = {
  backlog: "backlog",
  "to do": "todo",
  todo: "todo",
  open: "todo",
  draft: "backlog",
  "new request": "backlog",
  "needs refinement": "backlog",
  "ready for planning": "backlog",
  planned: "todo",
  "in progress": "in_progress",
  "in review": "review",
  review: "review",
  "code review": "review",
  "functional review": "review",
  "design review": "review",
  "product review": "review",
  "qa testing": "qa_testing",
  qa: "qa_testing",
  testing: "qa_testing",
  "ready for deployment": "ready_deployment",
  "ready deployment": "ready_deployment",
  "business ready": "ready_deployment",
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
    const byId = options.find((o) => o.id === field.value);
    if (byId) return byId.name;
  }

  if (typeof field.value === "number") {
    const byIndex = options.find((o) => o.orderindex === field.value);
    if (byIndex) return byIndex.name;
  }

  return null;
}

export function getProductFromTask(task: ClickUpTask): ProductKey {
  const field = findCustomField(task, "Product");
  const optionName = field ? resolveDropdownOptionName(field) : null;
  const fromField = optionName
    ? PRODUCT_FIELD_TO_KEY[optionName.trim().toLowerCase()]
    : undefined;
  return fromField ?? inferProductFromTitle(task.name);
}

function getReleaseVersion(task: ClickUpTask): string | undefined {
  const field = findCustomField(task, "Release Version");
  if (!field || typeof field.value !== "string") return undefined;
  return field.value.trim() || undefined;
}

export function isRoadmapEligible(task: ClickUpTask): boolean {
  return !EXCLUDED_STATUSES.has(task.status.status.trim().toLowerCase());
}

function toIsoDate(ms: string | null | undefined): string | null {
  if (!ms) return null;
  const n = Number(ms);
  if (Number.isNaN(n)) return null;
  return new Date(n).toISOString();
}

const DEFAULT_DURATION_DAYS = 10;

/**
 * Maps a ClickUp task to a RoadmapItem. When the task has a due date but no
 * start date, backfills a default lead time. When it has neither, leaves
 * startDate/dueDate empty — the caller (data-source.ts) auto-schedules
 * these against a view-appropriate window (current sprint dates, or the
 * target quarter) since that needs the full item list, not just one task.
 */
export function mapClickUpTaskToRoadmapItem(task: ClickUpTask): RoadmapItem | null {
  if (!isRoadmapEligible(task)) return null;

  const product = getProductFromTask(task);
  const due = toIsoDate(task.due_date);
  const start =
    toIsoDate(task.start_date) ??
    (due
      ? new Date(new Date(due).getTime() - DEFAULT_DURATION_DAYS * 86_400_000).toISOString()
      : "");

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
    dueDate: due ?? "",
    version: getReleaseVersion(task),
    taskCount: 1,
    tasks: [
      {
        id: task.id,
        name: task.name,
        status: mapClickUpStatus(task.status.status),
        assignee: assignee?.username,
        dueDate: due ?? undefined,
        url: task.url,
      },
    ],
    comments: [],
    attachments: [],
    dependencies: [],
    isMock: false,
  };
}

export function mapClickUpTasksToRoadmapItems(tasks: ClickUpTask[]): RoadmapItem[] {
  return tasks
    .map(mapClickUpTaskToRoadmapItem)
    .filter((item): item is RoadmapItem => item !== null);
}
