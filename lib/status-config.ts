import type { Priority, RoadmapStatus } from "./types";

export const STATUS_CONFIG: Record<
  RoadmapStatus,
  { label: string; dot: string; badgeClass: string; barClass: string }
> = {
  backlog: {
    label: "Backlog",
    dot: "#94a3b8",
    badgeClass: "bg-slate-100 text-slate-600",
    barClass: "bg-slate-300",
  },
  todo: {
    label: "Todo",
    dot: "#64748b",
    badgeClass: "bg-slate-100 text-slate-700",
    barClass: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    dot: "#3b82f6",
    badgeClass: "bg-blue-50 text-blue-700",
    barClass: "bg-blue-500",
  },
  review: {
    label: "Review",
    dot: "#8b5cf6",
    badgeClass: "bg-violet-50 text-violet-700",
    barClass: "bg-violet-500",
  },
  qa_testing: {
    label: "QA Testing",
    dot: "#f59e0b",
    badgeClass: "bg-amber-50 text-amber-700",
    barClass: "bg-amber-500",
  },
  ready_deployment: {
    label: "Ready Deployment",
    dot: "#06b6d4",
    badgeClass: "bg-cyan-50 text-cyan-700",
    barClass: "bg-cyan-500",
  },
  production: {
    label: "Production",
    dot: "#10b981",
    badgeClass: "bg-emerald-50 text-emerald-700",
    barClass: "bg-emerald-500",
  },
  blocked: {
    label: "Blocked",
    dot: "#ef4444",
    badgeClass: "bg-red-50 text-red-700",
    barClass: "bg-red-500",
  },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; badgeClass: string }> = {
  high: { label: "High", badgeClass: "bg-red-50 text-red-600" },
  medium: { label: "Medium", badgeClass: "bg-amber-50 text-amber-600" },
  low: { label: "Low", badgeClass: "bg-slate-100 text-slate-600" },
};

export const STATUS_ORDER: RoadmapStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "qa_testing",
  "ready_deployment",
  "production",
  "blocked",
];
