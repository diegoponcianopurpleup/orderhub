export const isProduction = process.env.NODE_ENV === "production";

const DEFAULT_DEV_SECRET = "dev-secret";
const DEFAULT_DEV_SECRET_ALT = "change-me-in-production";

export function getSessionSecret() {
  const value = process.env.SESSION_SECRET || "";

  if (!isProduction) {
    return value || DEFAULT_DEV_SECRET;
  }

  if (!value || value === DEFAULT_DEV_SECRET || value === DEFAULT_DEV_SECRET_ALT || value.length < 32) {
    throw new Error("SESSION_SECRET invalido para producao. Use um segredo forte com pelo menos 32 caracteres.");
  }

  return value;
}

export function getDatabaseUrl() {
  const value = process.env.DATABASE_URL || "";

  if (!value) {
    throw new Error("DATABASE_URL nao definido.");
  }

  if (isProduction && value.startsWith("file:")) {
    throw new Error("DATABASE_URL em producao nao pode usar SQLite file:. Use banco gerenciado (ex: PostgreSQL).");
  }

  return value;
}

export function getAppUrl() {
  const explicit = process.env.APP_URL;
  if (explicit) return explicit;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
