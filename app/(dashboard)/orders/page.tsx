import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { OrderManager } from "@/components/forms/order-manager";

export default async function OrdersPage() {
  const session = await requireSession();

  const [productsRaw, addonsRaw, customers, ordersRaw] = await Promise.all([
    prisma.product.findMany({
      where: { companyId: session.companyId },
      include: { category: true },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    }),
    prisma.addon.findMany({ where: { companyId: session.companyId }, include: { products: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { companyId: session.companyId }, orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where: { companyId: session.companyId },
      include: {
        customer: true,
        items: { include: { addons: true } },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const products = productsRaw.map((item) => ({
    ...item,
    price: Number(item.price),
    category: item.category
      ? {
          ...item.category,
          position: item.category.position
        }
      : null
  }));

  const addons = addonsRaw.map((item) => ({ ...item, price: Number(item.price) }));

  const orders = ordersRaw.map((order) => ({
    ...order,
    discount: Number(order.discount),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      addons: item.addons.map((addon) => ({
        ...addon,
        unitPrice: Number(addon.unitPrice),
        subtotal: Number(addon.subtotal)
      }))
    })),
    payments: order.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Pedidos e comandas</h2>
      <OrderManager products={products} addons={addons} customers={customers} initialOrders={orders} />
    </section>
  );
}
