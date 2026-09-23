"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressBreakdown } from "@/lib/roadmap-stats";

const SLICES: { key: keyof Omit<ProgressBreakdown, "overallPct">; label: string; color: string }[] = [
  { key: "completed", label: "Completed", color: "#10b981" },
  { key: "inProgress", label: "In Progress", color: "#3b82f6" },
  { key: "planned", label: "Planned", color: "#f59e0b" },
  { key: "atRisk", label: "At Risk", color: "#f97316" },
  { key: "blocked", label: "Blocked", color: "#ef4444" },
];

export function RoadmapProgressDonut({ breakdown }: { breakdown: ProgressBreakdown }) {
  const data = SLICES.map((s) => ({ name: s.label, value: breakdown[s.key], color: s.color })).filter(
    (d) => d.value > 0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roadmap Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="relative h-[120px] w-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.length ? data : [{ name: "None", value: 1, color: "#e2e8f0" }]}
                dataKey="value"
                innerRadius={40}
                outerRadius={58}
                paddingAngle={2}
                strokeWidth={0}
              >
                {(data.length ? data : [{ color: "#e2e8f0" }]).map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-900">{breakdown.overallPct}%</span>
            <span className="text-[10px] text-slate-400">Overall</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {SLICES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-slate-500">{s.label}</span>
              <span className="ml-auto font-semibold text-slate-700">{breakdown[s.key]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
