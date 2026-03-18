import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requireApiSession(req);
    const products = await prisma.product.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: { category: true }
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiSession(req);
    const body = await req.json();

    const product = await prisma.product.create({
      data: {
        companyId: session.companyId,
        name: String(body.name || ""),
        description: body.description ? String(body.description) : null,
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
        price: Number(body.price || 0),
        isActive: Boolean(body.isActive ?? true),
        outOfStock: Boolean(body.outOfStock ?? false),
        position: Number(body.position || 0),
        categoryId: body.categoryId ? String(body.categoryId) : null
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
