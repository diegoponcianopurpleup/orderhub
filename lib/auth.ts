import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getSession() {
  const user = await prisma.user.findFirst({
    where: {
      email: "sensei@admin.com",
      isActive: true,
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function getCurrentCompany() {
  const session = await requireSession();

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  });

  if (!company) redirect("/onboarding");

  return company;
}
