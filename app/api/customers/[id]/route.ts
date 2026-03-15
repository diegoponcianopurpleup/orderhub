import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireApiSession(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.customer.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : existing.name,
        phone: body.phone !== undefined ? (body.phone ? String(body.phone) : null) : existing.phone,
        notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : existing.notes
      }
    });

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireApiSession(req);
    const { id } = await params;

    const existing = await prisma.customer.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
