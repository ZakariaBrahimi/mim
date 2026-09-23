import { NextResponse } from "next/server";
import { getMembers } from "@/lib/clickup/data-source";

export async function GET() {
  const { data, meta } = await getMembers();
  return NextResponse.json({ members: data, meta });
}
