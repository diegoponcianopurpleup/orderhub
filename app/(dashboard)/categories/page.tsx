import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { CategoryManager } from "@/components/forms/category-manager";

export default async function CategoriesPage() {
  const session = await requireSession();
  const categories = await prisma.category.findMany({
    where: { companyId: session.companyId },
    orderBy: [{ position: "asc" }, { name: "asc" }]
  });

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Gestão de categorias</h2>
      <CategoryManager initialCategories={categories.map((item) => ({ ...item, position: item.position }))} />
    </section>
  );
}
