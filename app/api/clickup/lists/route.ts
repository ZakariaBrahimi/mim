import { NextResponse } from "next/server";
import { getLists } from "@/lib/clickup/data-source";

export async function GET() {
  const { data, meta } = await getLists();
  return NextResponse.json({ lists: data, meta });
}
