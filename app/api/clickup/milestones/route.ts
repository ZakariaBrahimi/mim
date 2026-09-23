import { NextResponse } from "next/server";
import { getMilestones } from "@/lib/clickup/data-source";

export async function GET() {
  const { data, meta } = await getMilestones();
  return NextResponse.json({ milestones: data, meta });
}
