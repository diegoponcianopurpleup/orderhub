import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMasterToken, getMasterCookieName } from "@/lib/master-session";

function ensureMaster(req: NextRequest) {
  const token = req.cookies.get(getMasterCookieName())?.value;
  const session = parseMasterToken(token);
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function GET(req: NextRequest) {
  try {
    ensureMaster(req);
    const companies = await prisma.company.findMany({
      include: {
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { users: true, orders: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(companies);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
