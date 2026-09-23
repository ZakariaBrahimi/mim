import { CheckCircle2, Circle, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShort } from "@/lib/date-utils";
import type { Milestone } from "@/lib/types";

export function KeyMilestones({ milestones }: { milestones: Milestone[] }) {
  const now = new Date();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5 text-slate-400" />
          Key Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {milestones.map((m) => {
          const done = new Date(m.date) < now;
          return (
            <div key={m.id} className="flex items-center gap-2.5">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-300" />
              )}
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                {m.title}
              </span>
              <span className="shrink-0 text-xs text-slate-400">{formatShort(m.date)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
