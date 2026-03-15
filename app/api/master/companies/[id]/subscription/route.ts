import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMasterToken, getMasterCookieName } from "@/lib/master-session";
import { createChargeForSubscription, isBillingEnabled, getBillingProvider } from "@/lib/billing";

function ensureMaster(req: NextRequest) {
  const token = req.cookies.get(getMasterCookieName())?.value;
  const session = parseMasterToken(token);
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    ensureMaster(req);
    const { id } = await params;
    const body = await req.json();

    const planId = String(body.planId || "");
    if (!planId) return NextResponse.json({ error: "plan_required" }, { status: 400 });

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return NextResponse.json({ error: "company_not_found" }, { status: 404 });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });

    const existing = await prisma.subscription.findFirst({
      where: { companyId: id },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === "YEARLY") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const status = body.status || "ACTIVE";

    const result = await prisma.$transaction(async (tx) => {
      let subscription;
      if (existing) {
        subscription = await tx.subscription.update({
          where: { id: existing.id },
          data: {
            planId,
            status,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            canceledAt: status === "CANCELED" ? now : null
          }
        });
      } else {
        subscription = await tx.subscription.create({
          data: {
            companyId: id,
            planId,
            status,
            startsAt: now,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd
          }
        });
      }

      const shouldGenerateInvoice = body.generateInvoice !== false;
      let invoice = null;

      if (shouldGenerateInvoice) {
        invoice = await tx.invoice.create({
          data: {
            companyId: id,
            planId,
            amount: plan.price,
            currency: company.currency,
            status: "PENDING",
            dueDate: periodEnd,
            externalRef: isBillingEnabled() ? null : "billing-disabled"
          }
        });
      }

      return { subscription, invoice };
    });

    let charge = null;
    if (result.invoice) {
      charge = await createChargeForSubscription({
        companyId: id,
        subscriptionId: result.subscription.id,
        amount: Number(plan.price),
        currency: company.currency
      });

      if (charge.success) {
        await prisma.invoice.update({
          where: { id: result.invoice.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            externalRef: charge.externalRef || result.invoice.externalRef
          }
        });
      }
    }

    return NextResponse.json({
      billingEnabled: isBillingEnabled(),
      billingProvider: getBillingProvider(),
      subscription: result.subscription,
      invoiceId: result.invoice?.id || null,
      charge
    });
  } catch {
    return NextResponse.json({ error: "request_failed" }, { status: 400 });
  }
}
