"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProductIcon } from "./product-icon";
import { RoadmapBar } from "./roadmap-bar";
import { MilestoneOverlay } from "./milestone-marker";
import { daysBetween, getMonthsInRange } from "@/lib/date-utils";
import { STATUS_CONFIG } from "@/lib/status-config";
import { PRODUCTS } from "@/lib/clickup/mock-data";
import type { Milestone, ProductKey, RoadmapItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL_WIDTH = 288;

interface Props {
  items: RoadmapItem[];
  milestones: Milestone[];
  rangeStart: Date;
  rangeEnd: Date;
  onSelectItem: (item: RoadmapItem) => void;
  onDragEnd: (id: string, startDate: string, dueDate: string) => void;
}

export function RoadmapGantt({
  items,
  milestones,
  rangeStart,
  rangeEnd,
  onSelectItem,
  onDragEnd,
}: Props) {
  const [collapsed, setCollapsed] = useState<Partial<Record<ProductKey, boolean>>>({});
  const today = new Date();

  const months = useMemo(() => getMonthsInRange(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const totalDays = daysBetween(new Date(rangeStart), new Date(rangeEnd));

  const grouped = useMemo(() => {
    return PRODUCTS.map((product) => {
      const productItems = items.filter((i) => i.product === product.key);
      const avgProgress = productItems.length
        ? Math.round(
            productItems.reduce((sum, i) => sum + i.progress, 0) / productItems.length,
          )
        : 0;
      return { product, items: productItems, avgProgress };
    }).filter((g) => g.items.length > 0);
  }, [items]);

  const todayLeftPct =
    today >= rangeStart && today <= rangeEnd
      ? (daysBetween(new Date(rangeStart), new Date(today)) / totalDays) * 100
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      {/* Header row: month labels */}
      <div className="flex border-b border-border">
        <div
          className="shrink-0 border-r border-border px-4 py-3 text-xs font-semibold text-slate-400"
          style={{ width: LABEL_WIDTH }}
        >
          Product / Initiative
        </div>
        <div className="relative flex-1">
          <div className="flex h-full">
            {months.map((m, idx) => {
              const monthStart = m < rangeStart ? rangeStart : m;
              const monthEndRaw = new Date(m.getFullYear(), m.getMonth() + 1, 0);
              const monthEnd = monthEndRaw > rangeEnd ? rangeEnd : monthEndRaw;
              const widthPct = (daysBetween(new Date(monthStart), new Date(monthEnd)) / totalDays) * 100;
              return (
                <div
                  key={idx}
                  className="border-r border-border px-4 py-3 text-xs font-semibold text-slate-700 last:border-r-0"
                  style={{ width: `${widthPct}%` }}
                >
                  {m.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
              );
            })}
          </div>
          {todayLeftPct !== null && (
            <div
              className="pointer-events-none absolute top-full z-20 -mt-[1px] flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${todayLeftPct}%` }}
            >
              <span className="rounded-b-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Today
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative">
        {/* Grid-line + milestone overlay, aligned to the flexible timeline column */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-0"
          style={{ left: LABEL_WIDTH }}
        >
          <div className="relative h-full">
            <div className="flex h-full">
              {months.map((m, idx) => {
                const monthStart = m < rangeStart ? rangeStart : m;
                const monthEndRaw = new Date(m.getFullYear(), m.getMonth() + 1, 0);
                const monthEnd = monthEndRaw > rangeEnd ? rangeEnd : monthEndRaw;
                const widthPct =
                  (daysBetween(new Date(monthStart), new Date(monthEnd)) / totalDays) * 100;
                return (
                  <div
                    key={idx}
                    className="h-full border-r border-slate-100 last:border-r-0"
                    style={{ width: `${widthPct}%` }}
                  />
                );
              })}
            </div>
            {todayLeftPct !== null && (
              <div
                className="absolute inset-y-0 w-px bg-primary/40"
                style={{ left: `${todayLeftPct}%` }}
              />
            )}
            <MilestoneOverlay milestones={milestones} rangeStart={rangeStart} rangeEnd={rangeEnd} />
          </div>
        </div>

        {/* Rows */}
        <div className="relative z-[1]">
          {grouped.map(({ product, items: productItems, avgProgress }) => {
            const isCollapsed = collapsed[product.key];
            return (
              <div key={product.key}>
                {/* Product header row */}
                <button
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [product.key]: !c[product.key] }))
                  }
                  className="flex w-full items-center border-b border-border bg-slate-50/70 text-left hover:bg-slate-100/70"
                >
                  <div
                    className="flex shrink-0 items-center gap-2 px-4 py-2.5"
                    style={{ width: LABEL_WIDTH }}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${product.color}1a` }}
                    >
                      <ProductIcon name={product.icon} className="h-3.5 w-3.5" style={{ color: product.color } as React.CSSProperties} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-slate-800">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {productItems.length} initiative{productItems.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-end pr-4">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        avgProgress >= 60
                          ? "text-emerald-600"
                          : avgProgress >= 30
                            ? "text-amber-600"
                            : "text-slate-400",
                      )}
                    >
                      {avgProgress}%
                    </span>
                  </div>
                </button>

                {/* Item rows */}
                {!isCollapsed &&
                  productItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-stretch border-b border-border last:border-b-0 hover:bg-slate-50/60"
                    >
                      <div
                        className="flex shrink-0 items-center gap-2.5 py-2.5 pl-11 pr-3"
                        style={{ width: LABEL_WIDTH }}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: STATUS_CONFIG[item.status].dot }}
                        />
                        <button
                          onClick={() => onSelectItem(item)}
                          className="min-w-0 truncate text-left text-[13px] font-medium text-slate-700 hover:text-primary"
                        >
                          {item.title}
                        </button>
                        <Avatar className="ml-auto h-5 w-5 shrink-0">
                          <AvatarFallback
                            className="text-[9px]"
                            style={{ backgroundColor: item.owner.color }}
                          >
                            {item.owner.initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="relative flex-1 py-2.5">
                        <RoadmapBar
                          item={item}
                          rangeStart={rangeStart}
                          rangeEnd={rangeEnd}
                          onSelect={onSelectItem}
                          onDragEnd={onDragEnd}
                        />
                        {item.version && (
                          <Badge
                            variant="outline"
                            className="pointer-events-none absolute top-1/2 -translate-y-1/2 border-0 bg-transparent px-1 text-[10px] font-medium text-slate-400"
                            style={{
                              left: `calc(${
                                ((daysBetween(new Date(rangeStart), new Date(item.dueDate)) + 0.3) /
                                  totalDays) *
                                100
                              }% + 8px)`,
                            }}
                          >
                            {item.version}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}
          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm font-medium text-slate-600">No roadmap items match these filters</p>
              <p className="text-xs text-slate-400">Try widening your product, team or status filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
