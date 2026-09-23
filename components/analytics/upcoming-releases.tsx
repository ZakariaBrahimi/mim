import { ChevronRight, PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShort } from "@/lib/date-utils";
import type { UpcomingRelease } from "@/lib/roadmap-stats";

export function UpcomingReleases({ releases }: { releases: UpcomingRelease[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <PackageCheck className="h-3.5 w-3.5 text-slate-400" />
          Upcoming Releases
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {releases.length === 0 && (
          <p className="text-xs text-slate-400">No upcoming releases scheduled.</p>
        )}
        {releases.map((r) => (
          <div
            key={r.version}
            className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-slate-50"
          >
            <div className="w-12 shrink-0">
              <span className="text-sm font-semibold text-primary">{r.version}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-500">{formatShort(r.date)}</div>
              <div className="truncate text-xs text-slate-400">{r.products.join(", ")}</div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
