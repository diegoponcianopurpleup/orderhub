import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toMoney } from "@/lib/format";

type StatusKey = "OPEN" | "COMPLETED" | "CANCELED";

type RecentOrder = {
  id: string;
  code: string;
  status: StatusKey;
  prepStatus: "NEW" | "PREPARING" | "READY" | "DELIVERED";
  orderType: "COUNTER" | "PICKUP" | "DELIVERY" | "TABLE";
  total: number;
  createdAt: string;
  customerName: string;
};

const STATUS_LABEL: Record<StatusKey, string> = {
  OPEN: "Em aberto",
  COMPLETED: "Finalizado",
  CANCELED: "Cancelado"
};

const PAYMENT_LABEL: Record<"PIX" | "CASH" | "CARD" | "OTHER", string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CARD: "Cartão",
  OTHER: "Outro"
};

const ORDER_TYPE_LABEL: Record<"COUNTER" | "PICKUP" | "DELIVERY" | "TABLE", string> = {
  COUNTER: "Balcão",
  PICKUP: "Retirada",
  DELIVERY: "Delivery",
  TABLE: "Mesa"
};

export default async function DashboardPage() {
  const session = await requireSession();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayOrders = await prisma.order.findMany({
    where: { companyId: session.companyId, createdAt: { gte: startOfDay } },
    select: {
      id: true,
      code: true,
      status: true,
      prepStatus: true,
      orderType: true,
      total: true,
      createdAt: true,
      customer: { select: { name: true } },
      items: { select: { productName: true, quantity: true } },
      payments: { select: { method: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const completedToday = todayOrders.filter((order) => order.status === "COMPLETED");

  const totalSold = completedToday.reduce((sum, order) => sum + Number(order.total), 0);
  const totalOrders = todayOrders.length;
  const averageTicket = completedToday.length ? totalSold / completedToday.length : 0;

  const statusCount: Record<StatusKey, number> = {
    OPEN: 0,
    COMPLETED: 0,
    CANCELED: 0
  };

  const productCounter: Record<string, number> = {};
  const paymentCounter: Record<string, number> = {};

  todayOrders.forEach((order) => {
    statusCount[order.status as StatusKey] = (statusCount[order.status as StatusKey] || 0) + 1;
  });

  completedToday.forEach((order) => {
    order.items.forEach((item) => {
      productCounter[item.productName] = (productCounter[item.productName] || 0) + item.quantity;
    });

    order.payments.forEach((payment) => {
      paymentCounter[payment.method] = (paymentCounter[payment.method] || 0) + 1;
    });
  });

  const topProduct = Object.entries(productCounter).sort((a, b) => b[1] - a[1])[0] || null;
  const topPayment = Object.entries(paymentCounter).sort((a, b) => b[1] - a[1])[0] || null;

  const recentOrders: RecentOrder[] = todayOrders.slice(0, 10).map((order) => ({
    id: order.id,
    code: order.code,
    status: order.status as StatusKey,
    prepStatus: order.prepStatus,
    orderType: order.orderType,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    customerName: order.customer?.name || "Cliente avulso"
  }));

  return (
    <section className="space-y-5">
      <header className="panel">
        <p className="text-xs uppercase tracking-wide text-slate-500">Painel de gestão do dia</p>
        <h1 className="text-2xl font-bold">Visão geral da operação</h1>
        <p className="text-sm text-slate-500">Dados atualizados com base nos pedidos da empresa logada no dia de hoje.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel">
          <p className="text-xs text-slate-500">Total vendido hoje</p>
          <strong className="text-2xl font-bold">{toMoney(totalSold)}</strong>
        </article>
        <article className="panel">
          <p className="text-xs text-slate-500">Pedidos do dia</p>
          <strong className="text-2xl font-bold">{totalOrders}</strong>
        </article>
        <article className="panel">
          <p className="text-xs text-slate-500">Ticket médio do dia</p>
          <strong className="text-2xl font-bold">{toMoney(averageTicket)}</strong>
        </article>
        <article className="panel">
          <p className="text-xs text-slate-500">Produto mais vendido</p>
          <strong className="text-lg font-semibold">{topProduct ? `${topProduct[0]} (${topProduct[1]} un.)` : "Sem vendas"}</strong>
        </article>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <article className="panel">
          <p className="text-xs text-slate-500">Pedidos por status (dia)</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">Em aberto</p>
              <strong className="text-xl">{statusCount.OPEN}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">Finalizados</p>
              <strong className="text-xl">{statusCount.COMPLETED}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">Cancelados</p>
              <strong className="text-xl">{statusCount.CANCELED}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <p className="text-xs text-slate-500">Forma de pagamento mais usada (dia)</p>
          <h2 className="mt-2 text-2xl font-bold">
            {topPayment ? `${PAYMENT_LABEL[topPayment[0] as keyof typeof PAYMENT_LABEL] || topPayment[0]} (${topPayment[1]})` : "Sem pagamentos"}
          </h2>
          <p className="mt-2 text-xs text-slate-500">Considera apenas pedidos finalizados no dia.</p>
        </article>
      </div>

      <article className="panel overflow-x-auto">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Pedidos mais recentes</h2>
          <span className="text-xs text-slate-500">Top 10 do dia</span>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
              <th className="px-2 py-2">Código</th>
              <th className="px-2 py-2">Hora</th>
              <th className="px-2 py-2">Cliente</th>
              <th className="px-2 py-2">Tipo</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Preparo</th>
              <th className="px-2 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-2 font-semibold">{order.code}</td>
                <td className="px-2 py-2">{new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-2 py-2">{order.customerName}</td>
                <td className="px-2 py-2">{ORDER_TYPE_LABEL[order.orderType]}</td>
                <td className="px-2 py-2">{STATUS_LABEL[order.status]}</td>
                <td className="px-2 py-2">{order.prepStatus}</td>
                <td className="px-2 py-2 text-right font-semibold">{toMoney(order.total)}</td>
              </tr>
            ))}
            {!recentOrders.length ? (
              <tr>
                <td className="px-2 py-4 text-center text-slate-500" colSpan={7}>Sem pedidos hoje.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>
    </section>
  );
}
