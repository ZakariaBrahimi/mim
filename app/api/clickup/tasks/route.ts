import { NextResponse } from "next/server";
import { getRoadmapItems } from "@/lib/clickup/data-source";

export async function GET() {
  const { data, meta } = await getRoadmapItems();
  return NextResponse.json({ items: data, meta });
}
