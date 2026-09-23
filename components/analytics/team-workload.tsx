import { Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TeamWorkload as TeamWorkloadT } from "@/lib/roadmap-stats";

export function TeamWorkload({ teams }: { teams: TeamWorkloadT[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Users2 className="h-3.5 w-3.5 text-slate-400" />
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {teams.slice(0, 5).map((t) => (
          <div key={t.team} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-slate-500">{t.team}</span>
            <Progress value={t.workloadPct} className="h-1.5 flex-1" />
            <span className="w-8 shrink-0 text-right text-xs font-semibold text-slate-700">
              {t.workloadPct}%
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
