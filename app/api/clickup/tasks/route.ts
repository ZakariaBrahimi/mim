import { NextResponse } from "next/server";
import { getRoadmapItems } from "@/lib/clickup/data-source";
import type { RoadmapView } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view: RoadmapView = searchParams.get("view") === "design" ? "design" : "q4";

  const { data, meta } = await getRoadmapItems(view);
  return NextResponse.json({ items: data, meta });
}
