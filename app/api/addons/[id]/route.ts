export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireApiSession(req);
    const id = params.id;
    const body = await req.json();

    const existing = await prisma.addon.findFirst({
      where: {
        id,
        companyId: session.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const addon = await prisma.addon.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        price: body.price ?? undefined,
        isActive: body.isActive ?? undefined,
        outOfStock: body.outOfStock ?? undefined,
      },
    });

    return NextResponse.json(addon);
  } catch (error) {
    return NextResponse.json({ error: "request_failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireApiSession(req);
    const id = params.id;

    const existing = await prisma.addon.findFirst({
      where: {
        id,
        companyId: session.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await prisma.addon.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "request_failed" }, { status: 500 });
  }
}