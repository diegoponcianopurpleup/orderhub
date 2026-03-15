import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireApiSession(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.order.findFirst({
      where: { id, companyId: session.companyId },
      include: { items: { include: { addons: true } } }
    });

    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (existing.status !== "OPEN") return NextResponse.json({ error: "only_open_orders" }, { status: 400 });

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: "empty_items" }, { status: 400 });

    const subtotal = items.reduce((sum: number, item: any) => {
      const addonsTotal = (item.addons || []).reduce((s: number, addon: any) => s + Number(addon.unitPrice) * Number(addon.quantity), 0);
      return sum + Number(item.unitPrice) * Number(item.quantity) + addonsTotal;
    }, 0);

    const discount = Number(body.discount || 0);
    const total = Math.max(subtotal - discount, 0);

    const order = await prisma.$transaction(async (tx) => {
      await tx.orderItemAddon.deleteMany({ where: { orderItem: { orderId: id } } });
      await tx.orderItem.deleteMany({ where: { orderId: id } });

      const updated = await tx.order.update({
        where: { id },
        data: {
          customerId: body.customerId !== undefined ? (body.customerId ? String(body.customerId) : null) : existing.customerId,
          orderType: body.orderType || existing.orderType,
          notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : existing.notes,
          tableNumber: body.tableNumber !== undefined ? (body.tableNumber ? String(body.tableNumber) : null) : existing.tableNumber,
          discount,
          subtotal,
          total,
          items: {
            create: items.map((item: any) => {
              const itemAddonsTotal = (item.addons || []).reduce((s: number, addon: any) => s + Number(addon.unitPrice) * Number(addon.quantity), 0);
              const itemSubtotal = Number(item.unitPrice) * Number(item.quantity) + itemAddonsTotal;
              return {
                productId: item.productId || null,
                productName: String(item.productName),
                unitPrice: Number(item.unitPrice),
                quantity: Number(item.quantity),
                subtotal: itemSubtotal,
                addons: {
                  create: (item.addons || []).map((addon: any) => ({
                    addonId: addon.addonId || null,
                    addonName: String(addon.addonName),
                    unitPrice: Number(addon.unitPrice),
                    quantity: Number(addon.quantity),
                    subtotal: Number(addon.unitPrice) * Number(addon.quantity)
                  }))
                }
              };
            })
          }
        },
        include: {
          customer: true,
          items: { include: { addons: true } },
          payments: true
        }
      });

      return updated;
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = requireApiSession(req);
    const { id } = await params;

    const existing = await prisma.order.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
