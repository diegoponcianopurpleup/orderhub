import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.product.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : existing.name,
        description: body.description !== undefined ? (body.description ? String(body.description) : null) : existing.description,
        imageUrl: body.imageUrl !== undefined ? (body.imageUrl ? String(body.imageUrl) : null) : existing.imageUrl,
        price: body.price !== undefined ? Number(body.price) : existing.price,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        outOfStock: body.outOfStock !== undefined ? Boolean(body.outOfStock) : existing.outOfStock,
        position: body.position !== undefined ? Number(body.position) : existing.position,
        categoryId: body.categoryId !== undefined ? (body.categoryId ? String(body.categoryId) : null) : existing.categoryId
      }
    });

    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(req);
    const { id } = await params;

    const existing = await prisma.product.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
