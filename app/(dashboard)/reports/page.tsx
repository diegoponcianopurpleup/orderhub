import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toMoney } from "@/lib/format";

function parseDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const from = parseDate(params.from, defaultFrom);
  const to = parseDate(params.to, today);
  to.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      companyId: session.companyId,
      createdAt: { gte: from, lte: to }
    },
    include: { items: true, payments: true },
    orderBy: { createdAt: "desc" }
  });

  const completed = orders.filter((order) => order.status === "COMPLETED");
  const canceled = orders.filter((order) => order.status === "CANCELED");
  const open = orders.filter((order) => order.status === "OPEN");

  const sold = completed.reduce((sum, order) => sum + Number(order.total), 0);
  const avgTicket = completed.length ? sold / completed.length : 0;

  const productCounter: Record<string, number> = {};
  const paymentCounter: Record<string, number> = {};

  completed.forEach((order) => {
    order.items.forEach((item) => {
      productCounter[item.productName] = (productCounter[item.productName] || 0) + item.quantity;
    });
    order.payments.forEach((payment) => {
      paymentCounter[payment.method] = (paymentCounter[payment.method] || 0) + 1;
    });
  });

  const topProducts = Object.entries(productCounter).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const paymentMethods = Object.entries(paymentCounter).sort((a, b) => b[1] - a[1]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Relatórios</h2>

      <form className="panel grid gap-3 md:grid-cols-3" method="get">
        <div>
          <label className="mb-1 block text-sm">De</label>
          <input className="input" type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Até</label>
          <input className="input" type="date" name="to" defaultValue={to.toISOString().slice(0, 10)} />
        </div>
        <button className="btn-primary h-fit self-end" type="submit">Filtrar</button>
      </form>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <article className="panel"><p className="text-xs text-slate-500">Vendas período</p><strong>{toMoney(sold)}</strong></article>
        <article className="panel"><p className="text-xs text-slate-500">Ticket médio</p><strong>{toMoney(avgTicket)}</strong></article>
        <article className="panel"><p className="text-xs text-slate-500">Pedidos</p><strong>{orders.length}</strong></article>
        <article className="panel"><p className="text-xs text-slate-500">Finalizados</p><strong>{completed.length}</strong></article>
        <article className="panel"><p className="text-xs text-slate-500">Abertos</p><strong>{open.length}</strong></article>
        <article className="panel"><p className="text-xs text-slate-500">Cancelados</p><strong>{canceled.length}</strong></article>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="panel">
          <h3 className="mb-2 font-semibold">Produtos mais vendidos</h3>
          <ul className="space-y-1 text-sm">
            {topProducts.length ? topProducts.map(([name, qty]) => <li key={name}>{name}: {qty}</li>) : <li>Sem dados.</li>}
          </ul>
        </article>

        <article className="panel">
          <h3 className="mb-2 font-semibold">Formas de pagamento</h3>
          <ul className="space-y-1 text-sm">
            {paymentMethods.length ? paymentMethods.map(([method, qty]) => <li key={method}>{method}: {qty}</li>) : <li>Sem dados.</li>}
          </ul>
        </article>
      </div>
    </section>
  );
}
