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
