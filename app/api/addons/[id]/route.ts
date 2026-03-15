export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = requireApiSession(req);
    const { id } = await context.params;
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

    const productIds: string[] | undefined = Array.isArray(body.productIds)
      ? body.productIds.map((productId: unknown) => String(productId))
      : undefined;

    const addon = await prisma.addon.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name) : undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        outOfStock:
          body.outOfStock !== undefined ? Boolean(body.outOfStock) : undefined,
        products:
          productIds !== undefined
            ? {
                deleteMany: {},
                create: productIds.map((productId) => ({
                  productId,
                })),
              }
            : undefined,
      },
      include: {
        products: true,
      },
    });

    return NextResponse.json(addon);
  } catch (error) {
    return NextResponse.json(
      { error: "request_failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = requireApiSession(req);
    const { id } = await context.params;

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
    return NextResponse.json(
      { error: "request_failed" },
      { status: 500 }
    );
  }
}