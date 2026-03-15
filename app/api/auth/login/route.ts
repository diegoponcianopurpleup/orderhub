export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, getSessionCookieName } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  const user = await prisma.user.findFirst({ where: { email, isActive: true } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    if (!user) {
  return NextResponse.json({ error: "user_not_found" }, { status: 401 });
}

  const token = createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    name: user.name,
    email: user.email
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
