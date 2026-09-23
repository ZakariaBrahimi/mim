import { Layers, PlayCircle, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DeliveryOverview } from "@/lib/roadmap-stats";
import { cn } from "@/lib/utils";

const CARDS: {
  key: keyof DeliveryOverview;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}[] = [
  { key: "total", label: "Total Features", icon: Layers, iconClass: "bg-indigo-50 text-indigo-600" },
  { key: "inProgress", label: "In Progress", icon: PlayCircle, iconClass: "bg-blue-50 text-blue-600" },
  { key: "completed", label: "Completed", icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-600" },
  { key: "blocked", label: "Blocked", icon: AlertTriangle, iconClass: "bg-red-50 text-red-600" },
  { key: "upcoming", label: "Upcoming", icon: Clock, iconClass: "bg-amber-50 text-amber-600" },
];

export function DeliveryOverviewCards({ overview }: { overview: DeliveryOverview }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map(({ key, label, icon: Icon, iconClass }) => (
        <Card key={key} className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold tabular-nums text-slate-900">
              {overview[key]}
            </span>
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconClass)}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
        </Card>
      ))}
    </div>
  );
}
