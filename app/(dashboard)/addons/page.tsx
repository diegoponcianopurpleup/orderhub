import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { AddonManager } from "@/components/forms/addon-manager";

export default async function AddonsPage() {
  const session = await requireSession();

  const [addons, products] = await Promise.all([
    prisma.addon.findMany({
      where: { companyId: session.companyId },
      include: { products: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.product.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    })
  ]);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Gestão de complementos</h2>
      <AddonManager
        initialAddons={addons.map((item) => ({ ...item, price: Number(item.price) }))}
        products={products.map((item) => ({
          ...item,
          price: Number(item.price),
          category: null
        }))}
      />
    </section>
  );
}
