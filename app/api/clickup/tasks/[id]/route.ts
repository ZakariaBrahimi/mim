import { NextResponse } from "next/server";
import { isClickUpConfigured } from "@/lib/clickup/client";

interface UpdateBody {
  startDate?: string;
  dueDate?: string;
  status?: string;
}

const STATUS_TO_CLICKUP: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  qa_testing: "QA Testing",
  ready_deployment: "Ready for Deployment",
  production: "Production",
  blocked: "Blocked",
};

/**
 * Updates a roadmap item's schedule. In live mode this proxies to ClickUp's
 * task update endpoint; in mock mode (no credentials, or no DB backing the
 * seed data) it simply acknowledges the change so the UI can update
 * optimistically without persisting server-side.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body: UpdateBody = await request.json();

  if (!isClickUpConfigured() || id.startsWith("mock-") || !id.startsWith("cu-")) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      id,
      ...body,
    });
  }

  const token = process.env.CLICKUP_API_TOKEN!;
  const clickupTaskId = id.replace(/^cu-/, "");

  const payload: Record<string, number | string> = {};
  if (body.startDate) payload.start_date = new Date(body.startDate).getTime();
  if (body.dueDate) payload.due_date = new Date(body.dueDate).getTime();
  if (body.status) payload.status = STATUS_TO_CLICKUP[body.status] ?? body.status;

  const res = await fetch(`https://api.clickup.com/api/v2/task/${clickupTaskId}`, {
    method: "PUT",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: `ClickUp update failed: ${text}` },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true, mode: "live", id, ...body });
}
