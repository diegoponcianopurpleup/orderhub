import { createHmac } from "crypto";
import { getSessionSecret } from "@/lib/env";

const MASTER_COOKIE = "orderhub_master_session";

export type MasterSessionPayload = {
  userId: string;
  role: "SUPER_ADMIN" | "SUPPORT";
  name: string;
  email: string;
  exp: number;
};

function secret() {
  return getSessionSecret();
}

export function getMasterCookieName() {
  return MASTER_COOKIE;
}

export function createMasterToken(payload: Omit<MasterSessionPayload, "exp">, ttlSeconds = 60 * 60 * 12) {
  const data: MasterSessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function parseMasterToken(token: string | undefined | null): MasterSessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as MasterSessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}



