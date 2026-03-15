import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod, PrepStatus, OrderStatus, OrderType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

type IncomingItem = {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  addons?: Array<{ addonId?: string; addonName: string; unitPrice: number; quantity: number }>;
};

export async function GET(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const status = req.nextUrl.searchParams.get("status") as OrderStatus | null;
    const prepStatus = req.nextUrl.searchParams.get("prepStatus") as PrepStatus | null;
    const view = req.nextUrl.searchParams.get("view");

    const where = {
      companyId: session.companyId,
      ...(status ? { status } : {}),
      ...(prepStatus ? { prepStatus } : {})
    };

    if (view === "kitchen") {
      const orders = await prisma.order.findMany({
        where,
        select: {
          id: true,
          code: true,
          orderType: true,
          status: true,
          prepStatus: true,
          notes: true,
          tableNumber: true,
          total: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              addons: { select: { id: true, addonName: true, quantity: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return NextResponse.json(orders);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: { include: { addons: true } },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const body = await req.json();

    const items = (body.items || []) as IncomingItem[];
    if (!items.length) return NextResponse.json({ error: "empty_items" }, { status: 400 });

    const subtotal = items.reduce((sum, item) => {
      const addonsTotal = (item.addons || []).reduce((s, addon) => s + Number(addon.unitPrice) * Number(addon.quantity), 0);
      return sum + Number(item.unitPrice) * Number(item.quantity) + addonsTotal;
    }, 0);

    const discount = Number(body.discount || 0);
    const total = Math.max(subtotal - discount, 0);

    const finalizeNow = Boolean(body.finalizeNow);
    const paymentMethod = finalizeNow ? ((body.paymentMethod as PaymentMethod) || PaymentMethod.PIX) : undefined;

    const countToday = await prisma.order.count({
      where: {
        companyId: session.companyId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    });

    const code = `CMD-${String(countToday + 1).padStart(3, "0")}`;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          companyId: session.companyId,
          customerId: body.customerId ? String(body.customerId) : null,
          code,
          orderType: (body.orderType as OrderType) || OrderType.COUNTER,
          status: finalizeNow ? OrderStatus.COMPLETED : OrderStatus.OPEN,
          prepStatus: PrepStatus.NEW,
          notes: body.notes ? String(body.notes) : null,
          tableNumber: body.tableNumber ? String(body.tableNumber) : null,
          discount,
          subtotal,
          total,
          completedAt: finalizeNow ? new Date() : null,
          items: {
            create: items.map((item) => {
              const itemAddonsTotal = (item.addons || []).reduce((s, addon) => s + Number(addon.unitPrice) * Number(addon.quantity), 0);
              const itemSubtotal = Number(item.unitPrice) * Number(item.quantity) + itemAddonsTotal;

              return {
                productId: item.productId || null,
                productName: String(item.productName),
                unitPrice: Number(item.unitPrice),
                quantity: Number(item.quantity),
                subtotal: itemSubtotal,
                addons: {
                  create: (item.addons || []).map((addon) => ({
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
        }
      });

      if (finalizeNow && paymentMethod) {
        await tx.paymentSplit.create({
          data: {
            orderId: created.id,
            method: paymentMethod,
            amount: total
          }
        });
      }

      return tx.order.findUnique({
        where: { id: created.id },
        include: {
          customer: true,
          items: { include: { addons: true } },
          payments: true
        }
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const existing = await prisma.order.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const status = (body.status as OrderStatus) || existing.status;
    const prepStatus = (body.prepStatus as PrepStatus | undefined) || (status === OrderStatus.COMPLETED ? PrepStatus.DELIVERED : existing.prepStatus);
    const paymentMethod = body.paymentMethod as PaymentMethod | undefined;
    const paymentAmount = Number(body.paymentAmount || existing.total);

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          prepStatus,
          completedAt: status === OrderStatus.COMPLETED ? new Date() : existing.completedAt,
          canceledAt: status === OrderStatus.CANCELED ? new Date() : existing.canceledAt
        }
      });

      if (status === OrderStatus.COMPLETED && paymentMethod) {
        await tx.paymentSplit.deleteMany({ where: { orderId: id } });
        await tx.paymentSplit.create({
          data: {
            orderId: id,
            method: paymentMethod,
            amount: paymentAmount
          }
        });
      }

      return updated;
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}


