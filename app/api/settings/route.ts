import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    return NextResponse.json(company);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = requireApiSession(req);
    const body = await req.json();

    const company = await prisma.company.update({
      where: { id: session.companyId },
      data: {
        name: body.name !== undefined ? String(body.name) : undefined,
        logoUrl: body.logoUrl !== undefined ? (body.logoUrl ? String(body.logoUrl) : null) : undefined,
        primaryColor: body.primaryColor !== undefined ? String(body.primaryColor) : undefined,
        secondaryColor: body.secondaryColor !== undefined ? String(body.secondaryColor) : undefined,
        phone: body.phone !== undefined ? (body.phone ? String(body.phone) : null) : undefined,
        address: body.address !== undefined ? (body.address ? String(body.address) : null) : undefined,
        businessType: body.businessType !== undefined ? (body.businessType ? String(body.businessType) : null) : undefined,
        slogan: body.slogan !== undefined ? (body.slogan ? String(body.slogan) : null) : undefined,
        currency: body.currency !== undefined ? String(body.currency) : undefined,
        darkMode: body.darkMode !== undefined ? Boolean(body.darkMode) : undefined
      }
    });

    return NextResponse.json(company);
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
