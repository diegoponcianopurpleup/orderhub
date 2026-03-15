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
    const plans = await prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureMaster(req);
    const body = await req.json();
    const plan = await prisma.plan.create({
      data: {
        code: String(body.code || "").toLowerCase(),
        name: String(body.name || ""),
        description: body.description ? String(body.description) : null,
        interval: body.interval || "MONTHLY",
        price: Number(body.price || 0),
        isActive: Boolean(body.isActive ?? true),
        maxUsers: body.maxUsers !== undefined ? Number(body.maxUsers) : null,
        maxOrdersPerMonth: body.maxOrdersPerMonth !== undefined ? Number(body.maxOrdersPerMonth) : null
      }
    });
    return NextResponse.json(plan, { status: 201 });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
