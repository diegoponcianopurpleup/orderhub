import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const categories = await prisma.category.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const body = await req.json();

    const category = await prisma.category.create({
      data: {
        companyId: session.companyId,
        name: String(body.name || ""),
        isActive: Boolean(body.isActive ?? true),
        position: Number(body.position || 0)
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
