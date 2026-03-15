export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getSessionCookieName());
  return response;
}
