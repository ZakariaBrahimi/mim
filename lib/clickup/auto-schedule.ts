import type { Priority, RoadmapItem } from "../types";
import { addDays, daysBetween } from "../date-utils";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const DEFAULT_DURATION_DAYS = 10;

/**
 * Assigns synthetic start/due dates to items that have no real ClickUp
 * dates, spreading them across [windowStart, windowEnd] in priority order
 * (highest priority first). Items keep their relative order but are allowed
 * to overlap with siblings — each roadmap item renders on its own Gantt
 * row, so overlapping dates between different items is normal (parallel
 * work), not a layout conflict.
 *
 * Items that already have a real due date are left untouched.
 */
export function autoScheduleItems(
  items: RoadmapItem[],
  windowStart: Date,
  windowEnd: Date,
  durationDays = DEFAULT_DURATION_DAYS,
): RoadmapItem[] {
  const scheduled = items.filter((i) => i.dueDate);
  const unscheduled = items.filter((i) => !i.dueDate);

  if (unscheduled.length === 0) return scheduled;

  const sorted = [...unscheduled].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );

  const totalDays = Math.max(1, daysBetween(new Date(windowStart), new Date(windowEnd)));
  const n = sorted.length;
  const step = n <= 1 ? 0 : Math.max(0, totalDays - durationDays) / (n - 1);

  const autoScheduled = sorted.map((item, i) => {
    const offsetDays = Math.round(i * step);
    const start = addDays(windowStart, offsetDays);
    const due = addDays(start, durationDays);
    return {
      ...item,
      startDate: start.toISOString(),
      dueDate: due.toISOString(),
      isAutoScheduled: true,
    };
  });

  return [...scheduled, ...autoScheduled];
}
