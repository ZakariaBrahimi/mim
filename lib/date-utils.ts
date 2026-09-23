export function daysBetween(a: Date, b: Date): number {
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLong(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Computes left/width percentages for a bar within a [rangeStart, rangeEnd] window.
 */
export function computeBarPosition(
  itemStart: string,
  itemEnd: string,
  rangeStart: Date,
  rangeEnd: Date,
): { leftPct: number; widthPct: number; clipped: boolean } {
  const totalDays = daysBetween(new Date(rangeStart), new Date(rangeEnd));
  const start = new Date(itemStart);
  const end = new Date(itemEnd);

  const clampedStart = start < rangeStart ? new Date(rangeStart) : start;
  const clampedEnd = end > rangeEnd ? new Date(rangeEnd) : end;

  const offsetDays = daysBetween(new Date(rangeStart), clampedStart);
  const durationDays = Math.max(
    1,
    daysBetween(clampedStart, clampedEnd),
  );

  const leftPct = (offsetDays / totalDays) * 100;
  const widthPct = (durationDays / totalDays) * 100;
  const clipped = start < rangeStart || end > rangeEnd;

  return { leftPct, widthPct, clipped };
}

/**
 * Derives the Gantt's display window from the actual roadmap data instead of
 * a hardcoded quarter, so the timeline adapts to whatever date range the
 * connected data source (mock seed data, or a live ClickUp sync scoped to
 * different lists) actually returns. Pads out to a minimum span so a
 * cluster of same-month items doesn't render as a single sliver column.
 */
export function computeDisplayRange(
  items: { startDate: string; dueDate: string }[],
  options?: { minMonths?: number },
): { start: Date; end: Date } {
  const minMonths = options?.minMonths ?? 3;

  if (items.length === 0) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + minMonths, 0);
    return { start, end };
  }

  let minStart = new Date(items[0].startDate);
  let maxEnd = new Date(items[0].dueDate);
  for (const item of items) {
    const s = new Date(item.startDate);
    const e = new Date(item.dueDate);
    if (s < minStart) minStart = s;
    if (e > maxEnd) maxEnd = e;
  }

  const start = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
  let end = new Date(maxEnd.getFullYear(), maxEnd.getMonth() + 1, 0);

  const monthSpan =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  if (monthSpan < minMonths) {
    end = new Date(start.getFullYear(), start.getMonth() + minMonths, 0);
  }

  return { start, end };
}

/**
 * Q4 of the year containing `now` — Oct 1 through Dec 31. If `now` is
 * already in Q4, rolls forward to next year's Q4 rather than returning a
 * mostly-past window.
 */
export function getQ4Window(now: Date = new Date()): { start: Date; end: Date } {
  const year = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  return {
    start: new Date(year, 9, 1),
    end: new Date(year, 11, 31),
  };
}

/**
 * Parses a ClickUp sprint list name like "Sprint 26 (9/23 - 10/6)" into a
 * concrete date range, anchored to whichever year makes the range closest
 * to `referenceDate` (handles a sprint spanning a Dec -> Jan year boundary).
 */
export function parseSprintDateRange(
  listName: string,
  referenceDate: Date = new Date(),
): { start: Date; end: Date } | null {
  const match = listName.match(
    /\((\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})\)/,
  );
  if (!match) return null;

  const [, sm, sd, em, ed] = match.map(Number) as unknown as [
    number,
    number,
    number,
    number,
    number,
  ];

  const refYear = referenceDate.getFullYear();
  let best: { start: Date; end: Date } | null = null;
  let bestDiff = Infinity;

  for (const yearOffset of [-1, 0, 1]) {
    const startYear = refYear + yearOffset;
    const endYear = em < sm ? startYear + 1 : startYear;
    const start = new Date(startYear, sm - 1, sd);
    const end = new Date(endYear, em - 1, ed);
    const midpoint = (start.getTime() + end.getTime()) / 2;
    const diff = Math.abs(midpoint - referenceDate.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = { start, end };
    }
  }

  return best;
}

export function getMonthsInRange(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}
