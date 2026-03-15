import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const customers = await prisma.customer.findMany({
      where: { companyId: session.companyId },
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const body = await req.json();

    const customer = await prisma.customer.create({
      data: {
        companyId: session.companyId,
        name: String(body.name || ""),
        phone: body.phone ? String(body.phone) : null,
        notes: body.notes ? String(body.notes) : null
      }
    });

    return NextResponse.json(customer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
