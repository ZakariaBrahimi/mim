"use client";

import { useRef, useState } from "react";
import { computeBarPosition, addDays } from "@/lib/date-utils";
import { STATUS_CONFIG } from "@/lib/status-config";
import type { RoadmapItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface Props {
  item: RoadmapItem;
  rangeStart: Date;
  rangeEnd: Date;
  onSelect: (item: RoadmapItem) => void;
  onDragEnd: (id: string, startDate: string, dueDate: string) => void;
}

export function RoadmapBar({ item, rangeStart, rangeEnd, onSelect, onDragEnd }: Props) {
  const [dragOffsetDays, setDragOffsetDays] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const widthRef = useRef(0);
  const totalDaysRef = useRef(1);

  const { leftPct, widthPct } = computeBarPosition(
    item.startDate,
    item.dueDate,
    rangeStart,
    rangeEnd,
  );

  const cfg = STATUS_CONFIG[item.status];

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (item.status === "blocked") return; // blocked items are locked from rescheduling
    e.stopPropagation();
    const row = e.currentTarget.parentElement as HTMLElement;
    widthRef.current = row.getBoundingClientRect().width;
    const totalDays = Math.max(
      1,
      Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000),
    );
    totalDaysRef.current = totalDays;
    startXRef.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const deltaX = e.clientX - startXRef.current;
    const pixelsPerDay = widthRef.current / totalDaysRef.current;
    const deltaDays = Math.round(deltaX / pixelsPerDay);
    setDragOffsetDays(deltaDays);
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dragOffsetDays !== 0) {
      const newStart = addDays(new Date(item.startDate), dragOffsetDays).toISOString();
      const newDue = addDays(new Date(item.dueDate), dragOffsetDays).toISOString();
      onDragEnd(item.id, newStart, newDue);
    }
    setDragOffsetDays(0);
  }

  const offsetPct = dragging
    ? (dragOffsetDays / totalDaysRef.current) * 100
    : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !dragging && onSelect(item)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        "group absolute top-1/2 flex h-6 -translate-y-1/2 cursor-grab items-center rounded-md px-2 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        cfg.barClass,
        item.status === "blocked" && "cursor-not-allowed opacity-80",
        dragging && "shadow-lg ring-2 ring-white",
      )}
      style={{
        left: `calc(${leftPct}% + ${offsetPct}%)`,
        width: `${widthPct}%`,
        minWidth: "28px",
      }}
      title={`${item.title} · ${STATUS_CONFIG[item.status].label} · ${item.progress}%`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-md bg-white/25"
        style={{ width: `${item.progress}%` }}
      />
      {item.status === "blocked" && <Lock className="relative h-3 w-3 shrink-0 text-white/90" />}
      <span className="relative truncate text-[11px] font-medium text-white/95">
        {widthPct > 8 ? item.title : ""}
      </span>
    </div>
  );
}
