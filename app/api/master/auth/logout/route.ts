export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getMasterCookieName } from "@/lib/master-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getMasterCookieName());
  return response;
}
