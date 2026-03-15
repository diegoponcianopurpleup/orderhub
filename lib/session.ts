import { createHmac } from "crypto";
import { getSessionSecret } from "@/lib/env";

const COOKIE_NAME = "orderhub_session";

export type SessionPayload = {
  userId: string;
  companyId: string;
  role: "ADMIN" | "MANAGER" | "ATTENDANT";
  name: string;
  email: string;
  exp: number;
};

function secret() {
  return getSessionSecret();
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">, ttlSeconds = 60 * 60 * 12) {
  const data: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function parseSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}



