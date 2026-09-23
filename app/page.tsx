"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Database, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { RoadmapToolbar } from "@/components/roadmap/roadmap-toolbar";
import { RoadmapGantt } from "@/components/roadmap/roadmap-gantt";
import { RoadmapDrawer } from "@/components/roadmap/roadmap-drawer";
import { DeliveryOverviewCards } from "@/components/analytics/delivery-overview-cards";
import { RoadmapProgressDonut } from "@/components/analytics/roadmap-progress-donut";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { ProductHealth } from "@/components/analytics/product-health";
import { UpcomingReleases } from "@/components/analytics/upcoming-releases";
import { KeyMilestones } from "@/components/analytics/key-milestones";
import { RisksPanel } from "@/components/analytics/risks-panel";
import { TeamWorkload } from "@/components/analytics/team-workload";
import { QuickStats } from "@/components/analytics/quick-stats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoadmapItems, useMilestones } from "@/hooks/use-roadmap-data";
import { useUpdateRoadmapItemDates } from "@/hooks/use-update-roadmap-item";
import {
  getDeliveryOverview,
  getProgressBreakdown,
  getProductHealth,
  getRisks,
  getTeamWorkload,
  getUpcomingReleases,
  getUpcomingMilestones,
  getVelocity,
} from "@/lib/roadmap-stats";
import { computeDisplayRange } from "@/lib/date-utils";
import { PRODUCTS } from "@/lib/clickup/mock-data";
import type { RoadmapFilters, RoadmapItem, RoadmapView } from "@/lib/types";

const VIEW_LABELS: Record<RoadmapView, { title: string; subtitle: string }> = {
  q4: {
    title: "MizaniyaPay Product Roadmap",
    subtitle: "Q4 2026 — Product Backlog + Current Sprint",
  },
  design: {
    title: "MizaniyaPay Design Roadmap",
    subtitle: "Design list only",
  },
};

export default function RoadmapPage() {
  const [view, setView] = useState<RoadmapView>("q4");
  const { data, isLoading, isError, refetch } = useRoadmapItems(view);
  const { data: milestonesData } = useMilestones();
  const updateDates = useUpdateRoadmapItemDates(view);

  const [filters, setFilters] = useState<RoadmapFilters>({
    product: "all",
    team: "all",
    status: "all",
  });
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleViewChange(next: string) {
    setView(next as RoadmapView);
    setFilters({ product: "all", team: "all", status: "all" });
    setDrawerOpen(false);
  }

  const items = data?.items ?? [];
  const milestones = milestonesData?.milestones ?? [];

  const teams = useMemo(
    () => Array.from(new Set(items.map((i) => i.team))).sort(),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (filters.product !== "all" && item.product !== filters.product) return false;
        if (filters.team !== "all" && item.team !== filters.team) return false;
        if (filters.status !== "all" && item.status !== filters.status) return false;
        return true;
      }),
    [items, filters],
  );

  const overview = useMemo(() => getDeliveryOverview(filteredItems), [filteredItems]);
  const breakdown = useMemo(() => getProgressBreakdown(filteredItems), [filteredItems]);
  const velocity = useMemo(() => getVelocity(items), [items]);
  const productHealth = useMemo(() => getProductHealth(items), [items]);
  const risks = useMemo(() => getRisks(items), [items]);
  const teamWorkload = useMemo(() => getTeamWorkload(items), [items]);
  const upcomingReleases = useMemo(() => getUpcomingReleases(items), [items]);
  const upcomingMilestones = useMemo(() => getUpcomingMilestones(milestones), [milestones]);
  const displayRange = useMemo(() => computeDisplayRange(items), [items]);

  function handleSelectItem(item: RoadmapItem) {
    setSelectedItem(item);
    setDrawerOpen(true);
  }

  function handleDragEnd(id: string, startDate: string, dueDate: string) {
    updateDates.mutate({ id, startDate, dueDate });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1920px] px-6 py-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {VIEW_LABELS[view].title}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">{VIEW_LABELS[view].subtitle}</p>
              </div>
              {data?.meta.mode === "mock" && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  <Database className="h-3.5 w-3.5" />
                  Showing seed data — connect ClickUp to sync live tasks
                </div>
              )}
            </div>

            <div className="mb-5">
              <Tabs value={view} onValueChange={handleViewChange}>
                <TabsList>
                  <TabsTrigger value="q4">Q4 2026 Roadmap</TabsTrigger>
                  <TabsTrigger value="design">Design Roadmap</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mb-5">
              <RoadmapToolbar
                filters={filters}
                onChange={setFilters}
                teams={teams}
                items={filteredItems}
                rangeStart={displayRange.start}
                rangeEnd={displayRange.end}
              />
            </div>

            <div className="mb-5">
              <DeliveryOverviewCards overview={overview} />
            </div>

            {isLoading && (
              <div className="flex h-[420px] items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading roadmap from ClickUp…
              </div>
            )}

            {isError && !isLoading && (
              <div className="flex h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
                <AlertCircle className="h-5 w-5" />
                Couldn&apos;t load the roadmap.
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {!isLoading && !isError && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-5">
                  <RoadmapGantt
                    items={filteredItems}
                    milestones={milestones}
                    rangeStart={displayRange.start}
                    rangeEnd={displayRange.end}
                    onSelectItem={handleSelectItem}
                    onDragEnd={handleDragEnd}
                  />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <VelocityChart data={velocity} />
                    <ProductHealth products={productHealth} />
                  </div>
                </div>

                <div className="space-y-5">
                  <RoadmapProgressDonut breakdown={breakdown} />
                  <UpcomingReleases releases={upcomingReleases} />
                  <KeyMilestones milestones={upcomingMilestones} />
                  <RisksPanel risks={risks} />
                  <TeamWorkload teams={teamWorkload} />
                  <QuickStats
                    totalInitiatives={items.length}
                    productCount={PRODUCTS.length}
                    riskCount={risks.length}
                    onTrackCount={
                      items.length -
                      risks.length -
                      items.filter((i) => i.status === "production").length
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <RoadmapDrawer
        item={selectedItem}
        allItems={items}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        view={view}
      />
    </div>
  );
}
