export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(...args: any[]) {
  try {
    const req = args[0];
    const context = args[1];

    const id = context.params.id;
    const body = await req.json();

    const addon = await prisma.addon.update({
      where: { id },
      data: {
        name: body.name,
        price: body.price,
        isActive: body.active
      }
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