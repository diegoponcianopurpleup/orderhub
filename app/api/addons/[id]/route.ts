export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    requireApiSession(req);

    const id = context.params.id;
    const body = await req.json();

    const addon = await prisma.addon.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(addon);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar addon" },
      { status: 500 }
    );
  }
}