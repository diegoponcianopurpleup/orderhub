export const runtime = "nodejs";
import { masterLogoutAction } from "@/lib/master-actions";
import { requireMasterSession } from "@/lib/master-auth";
import { prisma } from "@/lib/prisma";
import { MasterPanel } from "@/components/forms/master-panel";

export default async function MasterDashboardPage() {
  await requireMasterSession();

  const [plansRaw, companies] = await Promise.all([
    prisma.plan.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.company.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: { select: { users: true, orders: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const plans = plansRaw.map((plan) => ({ ...plan, price: Number(plan.price) }));

  return (
    <section className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Admin global</p>
          <h2 className="text-xl font-bold">Gestão SaaS</h2>
        </div>
        <form action={masterLogoutAction}>
          <button className="btn-secondary" type="submit">Sair</button>
        </form>
      </div>

      <MasterPanel initialPlans={plans} initialCompanies={companies} />
    </section>
  );
}
