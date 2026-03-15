import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const addons = await prisma.addon.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(addons);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const body = await req.json();
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : [];

    const addon = await prisma.addon.create({
      data: {
        companyId: session.companyId,
        name: String(body.name || ""),
        price: Number(body.price || 0),
        isActive: Boolean(body.isActive ?? true),
        outOfStock: Boolean(body.outOfStock ?? false),
        products: {
          create: productIds.map((productId) => ({ productId }))
        }
      },
      include: { products: true }
    });

    return NextResponse.json(addon, { status: 201 });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
