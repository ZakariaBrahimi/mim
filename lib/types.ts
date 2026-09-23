export type ProductKey =
  | "mobile"
  | "partner"
  | "gateway"
  | "admin"
  | "agents"
  | "market"
  | "market_admin"
  | "website"
  | "mtp"
  | "general";

export type RoadmapView = "q4" | "design";

export type RoadmapStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "qa_testing"
  | "ready_deployment"
  | "production"
  | "blocked";

export type Priority = "high" | "medium" | "low";

export interface Product {
  key: ProductKey;
  name: string;
  icon: string;
  color: string;
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  team: string;
}

export interface RoadmapTaskSummary {
  id: string;
  name: string;
  status: RoadmapStatus;
  assignee?: string;
  dueDate?: string;
  url?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface RoadmapItem {
  id: string;
  clickupTaskId?: string;
  clickupUrl?: string;
  title: string;
  description: string;
  businessGoal: string;
  product: ProductKey;
  team: string;
  owner: Member;
  status: RoadmapStatus;
  priority: Priority;
  progress: number;
  startDate: string;
  dueDate: string;
  version?: string;
  taskCount: number;
  tasks: RoadmapTaskSummary[];
  comments: Comment[];
  attachments: { id: string; name: string; url: string }[];
  dependencies: string[];
  isMock?: boolean;
  /** True when start/due dates were auto-scheduled (no real ClickUp dates were set on the task). */
  isAutoScheduled?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  product?: ProductKey;
  emoji: string;
}

export interface RoadmapFilters {
  product: ProductKey | "all";
  team: string | "all";
  status: RoadmapStatus | "all";
}

export interface DataSourceMeta {
  mode: "live" | "mock";
  reason?: string;
  fetchedAt: string;
}
