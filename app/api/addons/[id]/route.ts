import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireApiSession(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.addon.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const productIds: string[] | undefined = Array.isArray(body.productIds) ? body.productIds : undefined;

    const addon = await prisma.addon.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : existing.name,
        price: body.price !== undefined ? Number(body.price) : existing.price,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        outOfStock: body.outOfStock !== undefined ? Boolean(body.outOfStock) : existing.outOfStock,
        products: productIds
          ? {
              deleteMany: {},
              create: productIds.map((productId) => ({ productId }))
            }
          : undefined
      },
      include: { products: true }
    });

    return NextResponse.json(addon);
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireApiSession(req);
    const { id } = await params;

    const existing = await prisma.addon.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    await prisma.addon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
