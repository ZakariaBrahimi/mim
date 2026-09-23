"use client";

import { daysBetween } from "@/lib/date-utils";
import type { Milestone } from "@/lib/types";

export function MilestoneOverlay({
  milestones,
  rangeStart,
  rangeEnd,
}: {
  milestones: Milestone[];
  rangeStart: Date;
  rangeEnd: Date;
}) {
  const totalDays = daysBetween(new Date(rangeStart), new Date(rangeEnd));

  return (
    <>
      {milestones.map((m) => {
        const date = new Date(m.date);
        if (date < rangeStart || date > rangeEnd) return null;
        const leftPct = (daysBetween(new Date(rangeStart), date) / totalDays) * 100;
        return (
          <div
            key={m.id}
            className="group absolute top-0 z-10 flex h-full flex-col items-center"
            style={{ left: `${leftPct}%` }}
          >
            <div className="absolute top-0 h-full w-px border-l border-dashed border-amber-400/70" />
            <div className="absolute -top-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {m.emoji} {m.title}
            </div>
          </div>
        );
      })}
    </>
  );
}
