import type { ClickUpTask } from "./types";
import type {
  Priority,
  RoadmapItem,
  RoadmapStatus,
  ProductKey,
} from "../types";

const SPACE_TO_PRODUCT: Record<string, ProductKey> = {
  mobile: "mobile",
  "mobile app": "mobile",
  partner: "partner",
  "partner platform": "partner",
  "payment gateway": "gateway",
  gateway: "gateway",
  admin: "admin",
  "admin panel": "admin",
  operations: "agents",
  agents: "agents",
  "agent network": "agents",
  market: "market",
  "mizaniya market": "market",
};

const STATUS_MAP: Record<string, RoadmapStatus> = {
  backlog: "backlog",
  "to do": "todo",
  todo: "todo",
  open: "todo",
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

export function mapSpaceToProduct(spaceName: string): ProductKey | null {
  return SPACE_TO_PRODUCT[spaceName.trim().toLowerCase()] ?? null;
}

/** Custom field gate: only tasks explicitly flagged "Roadmap = Yes" surface on the roadmap. */
export function isRoadmapEligible(task: ClickUpTask): boolean {
  const field = task.custom_fields.find(
    (f) => f.name.trim().toLowerCase() === "roadmap",
  );
  if (!field) return false;

  if (typeof field.value === "boolean") return field.value;

  if (typeof field.value === "number" && field.type_config?.options) {
    const opt = field.type_config.options.find(
      (o) => Number((o as { orderindex?: number }).orderindex) === field.value,
    );
    return opt?.name.trim().toLowerCase() === "yes";
  }

  if (typeof field.value === "string") {
    return field.value.trim().toLowerCase() === "yes";
  }

  return false;
}

function toIsoDate(ms: string | null): string | null {
  if (!ms) return null;
  const n = Number(ms);
  if (Number.isNaN(n)) return null;
  return new Date(n).toISOString();
}

export function mapClickUpTaskToRoadmapItem(
  task: ClickUpTask,
): RoadmapItem | null {
  const product = mapSpaceToProduct(task.space.name);
  if (!product) return null;

  const start = toIsoDate(task.start_date) ?? toIsoDate(task.date_created ?? null);
  const due = toIsoDate(task.due_date);
  if (!start || !due) return null;

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
    progress: task.status.type === "closed" ? 100 : task.status.orderindex * 15,
    startDate: start,
    dueDate: due,
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
