import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { KitchenBoard } from "@/components/forms/kitchen-board";

export default async function KitchenPage() {
  const session = await requireSession();

  const ordersRaw = await prisma.order.findMany({
    where: {
      companyId: session.companyId,
      status: "OPEN"
    },
    include: {
      customer: true,
      items: { include: { addons: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const orders = ordersRaw.map((order) => ({
    ...order,
    prepStatus: order.prepStatus || "NEW",
    total: Number(order.total),
    createdAt: order.createdAt.toISOString()
  }));

  return <KitchenBoard initialOrders={orders} />;
}
