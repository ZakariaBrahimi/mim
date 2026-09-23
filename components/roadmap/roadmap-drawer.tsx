"use client";

import { useState } from "react";
import {
  ExternalLink,
  Paperclip,
  MessageSquare,
  GitBranch,
  Send,
  Calendar,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STATUS_CONFIG, STATUS_ORDER, PRIORITY_CONFIG } from "@/lib/status-config";
import { formatLong } from "@/lib/date-utils";
import { PRODUCTS } from "@/lib/clickup/mock-data";
import type { RoadmapItem } from "@/lib/types";
import { useUpdateRoadmapItemStatus, useAddRoadmapComment } from "@/hooks/use-update-roadmap-status";
import { cn } from "@/lib/utils";

interface Props {
  item: RoadmapItem | null;
  allItems: RoadmapItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoadmapDrawer({ item, allItems, open, onOpenChange }: Props) {
  const [commentText, setCommentText] = useState("");
  const updateStatus = useUpdateRoadmapItemStatus();
  const addComment = useAddRoadmapComment();

  if (!item) return null;

  const product = PRODUCTS.find((p) => p.key === item.product);
  const dependencyItems = item.dependencies
    .map((depId) => allItems.find((i) => i.id === depId))
    .filter((i): i is RoadmapItem => Boolean(i));

  function submitComment() {
    if (!commentText.trim() || !item) return;
    addComment.mutate({ id: item.id, text: commentText.trim() });
    setCommentText("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0">
        <SheetHeader>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-medium text-slate-500">
              {product?.name}
            </Badge>
            <Badge className={cn("border-0", PRIORITY_CONFIG[item.priority].badgeClass)}>
              {PRIORITY_CONFIG[item.priority].label} priority
            </Badge>
          </div>
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatLong(item.startDate)} — {formatLong(item.dueDate)}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-6 py-5">
            {/* Status + progress */}
            <div className="flex items-center gap-3">
              <Select
                value={item.status}
                onValueChange={(v) =>
                  updateStatus.mutate({ id: item.id, status: v as RoadmapItem["status"] })
                }
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs font-medium text-slate-500">{item.progress}% complete</span>
              {item.clickupUrl && (
                <a
                  href={item.clickupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto"
                >
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    Open in ClickUp
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>

            {/* Owner / Team */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]" style={{ backgroundColor: item.owner.color }}>
                    {item.owner.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-slate-600">{item.owner.name}</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{item.team}</span>
              {item.version && (
                <>
                  <span className="text-slate-300">•</span>
                  <Badge variant="outline">{item.version}</Badge>
                </>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </h4>
              <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>

            {/* Business goal */}
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Business Goal
              </h4>
              <p className="text-sm leading-relaxed text-slate-600">{item.businessGoal}</p>
            </div>

            {/* Dependencies */}
            {dependencyItems.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <GitBranch className="h-3.5 w-3.5" />
                  Dependencies
                </h4>
                <div className="space-y-1.5">
                  {dependencyItems.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-xs"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_CONFIG[dep.status].dot }}
                      />
                      <span className="truncate font-medium text-slate-700">{dep.title}</span>
                      <span className="ml-auto shrink-0 text-slate-400">
                        {STATUS_CONFIG[dep.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked ClickUp tasks */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Linked ClickUp Tasks ({item.tasks.length})
              </h4>
              <div className="space-y-1.5">
                {item.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_CONFIG[task.status].dot }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-700">{task.name}</span>
                    {task.assignee && (
                      <span className="shrink-0 text-slate-400">{task.assignee}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            {item.attachments.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments
                </h4>
                <div className="space-y-1.5">
                  {item.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      {a.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments ({item.comments.length})
              </h4>
              <div className="space-y-3">
                {item.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="bg-slate-400 text-[10px]">
                        {c.author
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-700">{c.author}</span>
                        <span className="text-[10px] text-slate-400">{formatLong(c.createdAt)}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">{c.text}</p>
                    </div>
                  </div>
                ))}
                {item.comments.length === 0 && (
                  <p className="text-xs text-slate-400">No comments yet.</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 border-t border-border p-4">
          <Input
            placeholder="Add a comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            className="text-sm"
          />
          <Button size="icon" onClick={submitComment} disabled={!commentText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
