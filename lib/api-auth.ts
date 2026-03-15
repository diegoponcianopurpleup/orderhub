import { NextRequest } from "next/server";
import { parseSessionToken, getSessionCookieName } from "@/lib/session";

export function requireApiSession(req: NextRequest) {
  const token = req.cookies.get(getSessionCookieName())?.value;
  const session = parseSessionToken(token);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
