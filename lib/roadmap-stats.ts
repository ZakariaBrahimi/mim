import type { Milestone, RoadmapItem } from "./types";
import { PRODUCTS } from "./clickup/mock-data";

export interface DeliveryOverview {
  total: number;
  inProgress: number;
  completed: number;
  blocked: number;
  upcoming: number;
}

export function getDeliveryOverview(items: RoadmapItem[]): DeliveryOverview {
  return {
    total: items.length,
    inProgress: items.filter((i) => i.status === "in_progress" || i.status === "review").length,
    completed: items.filter((i) => i.status === "production").length,
    blocked: items.filter((i) => i.status === "blocked").length,
    upcoming: items.filter((i) => i.status === "backlog" || i.status === "todo").length,
  };
}

export interface ProgressBreakdown {
  completed: number;
  inProgress: number;
  planned: number;
  atRisk: number;
  blocked: number;
  overallPct: number;
}

export function getProgressBreakdown(items: RoadmapItem[]): ProgressBreakdown {
  const completed = items.filter((i) => i.status === "production").length;
  const inProgress = items.filter(
    (i) => i.status === "in_progress" || i.status === "review" || i.status === "qa_testing" || i.status === "ready_deployment",
  ).length;
  const planned = items.filter((i) => i.status === "backlog" || i.status === "todo").length;
  const blocked = items.filter((i) => i.status === "blocked").length;
  const atRisk = items.filter(
    (i) => i.status !== "blocked" && i.status !== "production" && isAtRisk(i),
  ).length;

  const overallPct = items.length
    ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length)
    : 0;

  return { completed, inProgress, planned, atRisk, blocked, overallPct };
}

export function isAtRisk(item: RoadmapItem): boolean {
  const daysToDue = Math.round((new Date(item.dueDate).getTime() - Date.now()) / 86_400_000);
  return daysToDue >= 0 && daysToDue <= 10 && item.progress < 60;
}

export interface Risk {
  id: string;
  title: string;
  level: "High" | "Medium" | "Low";
}

export function getRisks(items: RoadmapItem[]): Risk[] {
  const risks: Risk[] = [];
  for (const item of items) {
    if (item.status === "blocked") {
      risks.push({ id: item.id, title: item.title, level: "High" });
    } else if (isAtRisk(item)) {
      risks.push({ id: item.id, title: item.title, level: item.progress < 35 ? "High" : "Medium" });
    }
  }
  return risks
    .sort((a, b) => (a.level === "High" ? -1 : 1) - (b.level === "High" ? -1 : 1))
    .slice(0, 6);
}

export interface VelocityPoint {
  month: string;
  completed: number;
}

export function getVelocity(items: RoadmapItem[]): VelocityPoint[] {
  const buckets = new Map<string, number>();
  for (const item of items) {
    if (item.status !== "production") continue;
    const d = new Date(item.dueDate);
    const key = d.toLocaleDateString("en-US", { month: "short" });
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  // Guarantee the 3 roadmap months always render, even at zero.
  const months = Array.from(
    new Set(items.map((i) => new Date(i.dueDate).toLocaleDateString("en-US", { month: "short" }))),
  );
  return months.map((month) => ({ month, completed: buckets.get(month) ?? 0 }));
}

export interface ProductHealth {
  key: string;
  name: string;
  color: string;
  progress: number;
  itemCount: number;
  blockedCount: number;
}

export function getProductHealth(items: RoadmapItem[]): ProductHealth[] {
  return PRODUCTS.map((product) => {
    const productItems = items.filter((i) => i.product === product.key);
    const progress = productItems.length
      ? Math.round(productItems.reduce((sum, i) => sum + i.progress, 0) / productItems.length)
      : 0;
    return {
      key: product.key,
      name: product.name,
      color: product.color,
      progress,
      itemCount: productItems.length,
      blockedCount: productItems.filter((i) => i.status === "blocked").length,
    };
  }).filter((p) => p.itemCount > 0);
}

export interface TeamWorkload {
  team: string;
  activeCount: number;
  workloadPct: number;
}

export function getTeamWorkload(items: RoadmapItem[]): TeamWorkload[] {
  const byTeam = new Map<string, number>();
  for (const item of items) {
    if (item.status === "production") continue;
    byTeam.set(item.team, (byTeam.get(item.team) ?? 0) + 1);
  }
  const max = Math.max(1, ...byTeam.values());
  return Array.from(byTeam.entries())
    .map(([team, activeCount]) => ({
      team,
      activeCount,
      workloadPct: Math.round((activeCount / max) * 100),
    }))
    .sort((a, b) => b.workloadPct - a.workloadPct);
}

export interface UpcomingRelease {
  version: string;
  date: string;
  products: string[];
}

export function getUpcomingReleases(items: RoadmapItem[]): UpcomingRelease[] {
  const byVersion = new Map<string, { dates: string[]; products: Set<string> }>();
  for (const item of items) {
    if (!item.version) continue;
    const entry = byVersion.get(item.version) ?? { dates: [], products: new Set<string>() };
    entry.dates.push(item.dueDate);
    entry.products.add(
      PRODUCTS.find((p) => p.key === item.product)?.name ?? item.product,
    );
    byVersion.set(item.version, entry);
  }
  return Array.from(byVersion.entries())
    .map(([version, { dates, products }]) => ({
      version,
      date: dates.sort().slice(-1)[0],
      products: Array.from(products),
    }))
    .filter((r) => new Date(r.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);
}

export function getUpcomingMilestones(milestones: Milestone[], limit = 5): Milestone[] {
  return [...milestones]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}
