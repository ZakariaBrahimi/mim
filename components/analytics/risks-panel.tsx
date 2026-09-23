import { AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Risk } from "@/lib/roadmap-stats";

const LEVEL_BADGE: Record<Risk["level"], string> = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-slate-100 text-slate-600",
};

export function RisksPanel({ risks }: { risks: Risk[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <AlertOctagon className="h-3.5 w-3.5 text-slate-400" />
          Risks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {risks.length === 0 && <p className="text-xs text-slate-400">No active risks detected.</p>}
        {risks.map((r) => (
          <div key={r.id} className="flex items-center gap-2.5">
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
              {r.title}
            </span>
            <Badge className={LEVEL_BADGE[r.level]}>{r.level}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
