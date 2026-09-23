"use client";

import {
  Home,
  Inbox,
  Target,
  LayoutDashboard,
  Map,
  ListTodo,
  Rocket,
  Goal,
  Compass,
  ClipboardList,
  Smartphone,
  ShieldCheck,
  Handshake,
  CreditCard,
  Settings2,
  Plug,
  Server,
  Star,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { label: "Home", icon: Home },
  { label: "Inbox", icon: Inbox, badge: 3 },
  { label: "Goals", icon: Goal },
  { label: "Dashboards", icon: LayoutDashboard },
];

const productManagementNav = [
  { label: "Product Roadmap", icon: Map, active: true },
  { label: "Backlog", icon: ListTodo },
  { label: "Releases", icon: Rocket },
  { label: "OKRs", icon: Target },
  { label: "Discovery", icon: Compass },
  { label: "Product Dashboard", icon: ClipboardList },
];

const productsNav = [
  { label: "Mobile App", icon: Smartphone },
  { label: "Admin Panel", icon: ShieldCheck },
  { label: "Partner Platform", icon: Handshake },
  { label: "Payment Gateway", icon: CreditCard },
  { label: "Integrations", icon: Plug },
  { label: "Infrastructure", icon: Server },
];

const favoritesNav = [
  { label: "Q4 2026 Roadmap", color: "#ec4899" },
  { label: "Release v1.4", color: "#3b82f6" },
  { label: "Critical Issues", color: "#22c55e" },
];

function NavRow({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2.5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      <span>{children}</span>
      <ChevronDown className="h-3 w-3" />
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          M
        </div>
        <span className="text-[15px] font-semibold tracking-tight">MizaniyaPay</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        <div className="mb-1 flex items-center justify-between px-1 pb-2 text-[13px] font-semibold text-slate-700">
          <span>MizaniyaPay</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <NavRow key={item.label} {...item} />
          ))}
        </div>

        <SectionLabel>Product Management</SectionLabel>
        <div className="space-y-0.5">
          {productManagementNav.map((item) => (
            <NavRow key={item.label} {...item} />
          ))}
        </div>

        <SectionLabel>Products</SectionLabel>
        <div className="space-y-0.5">
          {productsNav.map((item) => (
            <NavRow key={item.label} {...item} />
          ))}
        </div>

        <SectionLabel>Favorites</SectionLabel>
        <div className="space-y-0.5">
          {favoritesNav.map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Star className="h-3.5 w-3.5 shrink-0" style={{ color: item.color }} fill={item.color} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <NavRow icon={Settings2} label="Settings" />
      </div>
    </aside>
  );
}
