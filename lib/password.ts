import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 100_000;
const KEY_SIZE = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_SIZE, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const computed = pbkdf2Sync(password, salt, ITERATIONS, KEY_SIZE, DIGEST);
  const original = Buffer.from(hash, "hex");

  return original.length === computed.length && timingSafeEqual(original, computed);
}
