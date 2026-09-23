import { BarChart3, Boxes, GitPullRequestArrow, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function QuickStats({
  totalInitiatives,
  productCount,
  riskCount,
  onTrackCount,
}: {
  totalInitiatives: number;
  productCount: number;
  riskCount: number;
  onTrackCount: number;
}) {
  const stats = [
    { icon: BarChart3, value: totalInitiatives, label: "Total Initiatives" },
    { icon: Boxes, value: productCount, label: "Products" },
    { icon: GitPullRequestArrow, value: riskCount, label: "Risks" },
    { icon: CheckCircle, value: onTrackCount, label: "On Track" },
  ];

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-bold leading-none text-slate-900">{value}</div>
              <div className="mt-1 text-[11px] text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
