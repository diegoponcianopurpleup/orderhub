import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMasterCookieName, parseMasterToken } from "@/lib/master-session";

export async function getMasterSession() {
  const token = (await cookies()).get(getMasterCookieName())?.value;
  return parseMasterToken(token);
}

export async function requireMasterSession() {
  const session = await getMasterSession();
  if (!session) redirect("/master/login");

  const user = await prisma.platformUser.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) redirect("/master/login");

  return session;
}
