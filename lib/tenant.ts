import { prisma } from "@/lib/prisma";

export async function isSystemInitialized() {
  const count = await prisma.company.count();
  return count > 0;
}
