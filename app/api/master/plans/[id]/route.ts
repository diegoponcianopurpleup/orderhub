import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMasterToken, getMasterCookieName } from "@/lib/master-session";

function ensureMaster(req: NextRequest) {
  const token = req.cookies.get(getMasterCookieName())?.value;
  const session = parseMasterToken(token);
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    ensureMaster(req);
    const { id } = await params;
    const body = await req.json();

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : undefined,
        description: body.description !== undefined ? (body.description ? String(body.description) : null) : undefined,
        interval: body.interval !== undefined ? body.interval : undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        maxUsers: body.maxUsers !== undefined ? Number(body.maxUsers) : undefined,
        maxOrdersPerMonth: body.maxOrdersPerMonth !== undefined ? Number(body.maxOrdersPerMonth) : undefined
      }
    });

    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    ensureMaster(req);
    const { id } = await params;
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
