import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { isBillingEnabled, getBillingProvider } from "@/lib/billing";

export async function GET(req: NextRequest) {
  try {
    const session = requireApiSession(req);

    const subscription = await prisma.subscription.findFirst({
      where: { companyId: session.companyId },
      include: { plan: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      billingEnabled: isBillingEnabled(),
      billingProvider: getBillingProvider(),
      subscription
    });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
