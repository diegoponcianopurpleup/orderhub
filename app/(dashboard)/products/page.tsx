import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ProductManager } from "@/components/forms/product-manager";

export default async function ProductsPage() {
  const session = await requireSession();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { companyId: session.companyId },
      include: { category: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({
      where: { companyId: session.companyId, isActive: true },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    })
  ]);

  const normalizedProducts = products.map((item) => ({
    ...item,
    price: Number(item.price),
    category: item.category
      ? {
          ...item.category,
          position: item.category.position
        }
      : null
  }));

  const normalizedCategories = categories.map((item) => ({ ...item, position: item.position }));

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Gestão de produtos</h2>
      <ProductManager initialProducts={normalizedProducts} categories={normalizedCategories} />
    </section>
  );
}
