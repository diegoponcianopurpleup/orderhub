import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toMoney } from "@/lib/format";
import { PrintOnLoad } from "@/components/print/print-on-load";
import { PrintActions } from "@/components/print/print-actions";

type PrintPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ autoprint?: string }>;
};

export default async function PrintOrderPage({ params, searchParams }: PrintPageProps) {
  const session = await requireSession();
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const order = await prisma.order.findFirst({
    where: { id: resolvedParams.id, companyId: session.companyId },
    include: {
      customer: true,
      items: { include: { addons: true } }
    }
  });

  if (!order) {
    notFound();
  }

  const autoPrint = resolvedSearchParams?.autoprint === "1";

  return (
    <main className="mx-auto max-w-[380px] p-4 text-slate-900 print:p-0">
      <PrintOnLoad enabled={autoPrint} />

      <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm print:rounded-none print:border-none print:shadow-none">
        <header className="border-b border-dashed border-slate-300 pb-2 text-center">
          <h1 className="text-base font-bold">Pedido para Cozinha</h1>
          <p className="text-xs text-slate-500">{order.code}</p>
        </header>

        <div className="mt-2 space-y-1 text-sm">
          <p><strong>Codigo:</strong> {order.code}</p>
          <p><strong>Horario:</strong> {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
          <p><strong>Cliente:</strong> {order.customer?.name || "Cliente avulso"}</p>
          <p><strong>Total:</strong> {toMoney(Number(order.total))}</p>
        </div>

        <div className="mt-3 border-t border-dashed border-slate-300 pt-2">
          <h2 className="mb-1 text-sm font-bold">Itens</h2>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id}>
                <p className="font-semibold">{item.quantity}x {item.productName}</p>
                {item.addons.length ? (
                  <ul className="ml-3 text-xs text-slate-600">
                    {item.addons.map((addon) => (
                      <li key={addon.id}>+ {addon.quantity}x {addon.addonName}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {order.notes ? (
          <div className="mt-3 rounded-md border border-dashed border-slate-300 p-2 text-xs">
            <strong>Observacoes:</strong> {order.notes}
          </div>
        ) : null}

        <footer className="mt-4 border-t border-dashed border-slate-300 pt-2 text-center text-xs text-slate-500">
          Impresso em {new Date().toLocaleString("pt-BR")}
        </footer>
      </section>

      <PrintActions />
    </main>
  );
}