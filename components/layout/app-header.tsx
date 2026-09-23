"use client";

import { Search, Bell, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-white px-6">
      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search in MizaniyaPay..."
          className="h-9 border-slate-200 bg-slate-50 pl-9 pr-14 focus-visible:ring-primary/30"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
          <HelpCircle className="h-4.5 w-4.5" />
        </button>
        <div className="ml-1 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-[11px]">RM</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-[13px] font-medium text-slate-800">Rayen M.</div>
            <div className="text-[11px] text-slate-400">Product Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}
