"use client";

import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCTS } from "@/lib/clickup/mock-data";
import { monthLabel } from "@/lib/date-utils";
import { STATUS_CONFIG, STATUS_ORDER } from "@/lib/status-config";
import type { RoadmapFilters, RoadmapItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  filters: RoadmapFilters;
  onChange: (filters: RoadmapFilters) => void;
  teams: string[];
  items: RoadmapItem[];
  rangeStart: Date;
  rangeEnd: Date;
}

function exportCsv(items: RoadmapItem[]) {
  const header = [
    "Title",
    "Product",
    "Team",
    "Owner",
    "Status",
    "Priority",
    "Progress",
    "Start Date",
    "Due Date",
    "Version",
    "ClickUp Tasks",
  ];
  const rows = items.map((item) => [
    item.title,
    item.product,
    item.team,
    item.owner.name,
    STATUS_CONFIG[item.status].label,
    item.priority,
    `${item.progress}%`,
    item.startDate.slice(0, 10),
    item.dueDate.slice(0, 10),
    item.version ?? "",
    String(item.taskCount),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mizaniyapay-roadmap.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function RoadmapToolbar({ filters, onChange, teams, items, rangeStart, rangeEnd }: Props) {
  const rangeLabel =
    rangeStart.getFullYear() === rangeEnd.getFullYear() &&
    rangeStart.getMonth() === rangeEnd.getMonth()
      ? monthLabel(rangeStart)
      : `${monthLabel(rangeStart)} – ${monthLabel(rangeEnd)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" className="gap-1.5 text-slate-600">
        <Calendar className="h-3.5 w-3.5" />
        {rangeLabel}
      </Button>

      <Select
        value={filters.product}
        onValueChange={(v) => onChange({ ...filters, product: v as RoadmapFilters["product"] })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Product" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          {PRODUCTS.map((p) => (
            <SelectItem key={p.key} value={p.key}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.team}
        onValueChange={(v) => onChange({ ...filters, team: v })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Team" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v as RoadmapFilters["status"] })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full")}
                  style={{ backgroundColor: STATUS_CONFIG[s].dot }}
                />
                {STATUS_CONFIG[s].label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        className="ml-auto gap-1.5"
        onClick={() => exportCsv(items)}
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
    </div>
  );
}
