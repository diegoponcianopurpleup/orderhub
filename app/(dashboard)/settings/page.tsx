import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/auth";
import { SettingsForm } from "@/components/forms/settings-form";
import { isBillingEnabled, getBillingProvider } from "@/lib/billing";

export default async function SettingsPage() {
  const company = await getCurrentCompany();

  const subscription = await prisma.subscription.findFirst({
    where: { companyId: company.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Configurações do sistema</h2>

      <article className="panel space-y-2">
        <h3 className="text-lg font-semibold">Assinatura</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Plano atual: <strong>{subscription?.plan?.name || "Sem plano"}</strong>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Status: <strong>{subscription?.status || "N/A"}</strong>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Cobrança automática: <strong>{isBillingEnabled() ? "Ativada" : "Desativada"}</strong>
        </p>
        <p className="text-xs text-slate-500">Provider: {getBillingProvider()}</p>
      </article>

      <SettingsForm
        initial={{
          name: company.name,
          logoUrl: company.logoUrl,
          primaryColor: company.primaryColor,
          secondaryColor: company.secondaryColor,
          phone: company.phone,
          address: company.address,
          businessType: company.businessType,
          slogan: company.slogan,
          currency: company.currency,
          darkMode: company.darkMode
        }}
      />
    </section>
  );
}
