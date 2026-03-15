"use client";

import { FormEvent, useState } from "react";
import { toMoney } from "@/lib/format";

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  interval: "MONTHLY" | "YEARLY";
  price: number;
  isActive: boolean;
  maxUsers: number | null;
  maxOrdersPerMonth: number | null;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  businessType: string | null;
  _count: { users: number; orders: number };
  subscriptions: Array<{
    id: string;
    status: string;
    plan: { id: string; name: string };
  }>;
};

export function MasterPanel({ initialPlans, initialCompanies }: { initialPlans: Plan[]; initialCompanies: CompanyRow[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [companies, setCompanies] = useState(initialCompanies);
  const [form, setForm] = useState({ code: "", name: "", description: "", interval: "MONTHLY", price: 0, maxUsers: 1, maxOrdersPerMonth: 1000 });

  async function refresh() {
    const [plansData, companiesData] = await Promise.all([
      fetch("/api/master/plans", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/master/companies", { cache: "no-store" }).then((r) => r.json())
    ]);

    setPlans(plansData.map((p: any) => ({ ...p, price: Number(p.price) })));
    setCompanies(companiesData);
  }

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/master/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ code: "", name: "", description: "", interval: "MONTHLY", price: 0, maxUsers: 1, maxOrdersPerMonth: 1000 });
    await refresh();
  }

  async function togglePlan(plan: Plan) {
    await fetch(`/api/master/plans/${plan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive })
    });
    await refresh();
  }

  async function changeCompanyPlan(companyId: string, currentPlanId?: string) {
    const activePlans = plans.filter((plan) => plan.isActive);
    if (!activePlans.length) {
      window.alert("Nenhum plano ativo disponível.");
      return;
    }

    const options = activePlans.map((plan) => `${plan.id} | ${plan.name} (${toMoney(plan.price)})`).join("\n");
    const selected = window.prompt(`Escolha o ID do plano:\n${options}`, currentPlanId || activePlans[0].id);
    if (!selected) return;

    const selectedPlan = activePlans.find((plan) => plan.id === selected);
    if (!selectedPlan) {
      window.alert("Plano inválido.");
      return;
    }

    const response = await fetch(`/api/master/companies/${companyId}/subscription`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selected, status: "ACTIVE", generateInvoice: true })
    }).then((r) => r.json());

    if (response?.charge?.message) {
      window.alert(response.charge.message);
    }

    await refresh();
  }

  return (
    <section className="space-y-4">
      <article className="panel">
        <h3 className="mb-3 text-lg font-semibold">Criar plano</h3>
        <form onSubmit={createPlan} className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Código</label>
            <input className="input" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Nome</label>
            <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Preço</label>
            <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
          </div>

          <div>
            <label className="mb-1 block text-sm">Intervalo</label>
            <select className="input" value={form.interval} onChange={(e) => setForm((p) => ({ ...p, interval: e.target.value }))}>
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Máx usuários</label>
            <input className="input" type="number" value={form.maxUsers} onChange={(e) => setForm((p) => ({ ...p, maxUsers: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Máx pedidos/mês</label>
            <input className="input" type="number" value={form.maxOrdersPerMonth} onChange={(e) => setForm((p) => ({ ...p, maxOrdersPerMonth: Number(e.target.value) }))} />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-sm">Descrição</label>
            <input className="input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          <button className="btn-primary md:col-span-3" type="submit">Salvar plano</button>
        </form>
      </article>

      <article className="panel">
        <h3 className="mb-3 text-lg font-semibold">Planos</h3>
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-semibold">{plan.name} ({plan.code})</p>
              <p className="text-xs text-slate-500">{toMoney(plan.price)} • {plan.interval} • {plan.isActive ? "Ativo" : "Inativo"}</p>
              <p className="text-xs text-slate-500">ID: {plan.id}</p>
              <button className={plan.isActive ? "btn-danger mt-2" : "btn-primary mt-2"} onClick={() => togglePlan(plan)}>
                {plan.isActive ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h3 className="mb-3 text-lg font-semibold">Empresas</h3>
        <div className="space-y-2">
          {companies.map((company) => (
            <div key={company.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-semibold">{company.name} ({company.slug})</p>
              <p className="text-xs text-slate-500">{company.businessType || "Sem categoria"} • Usuários: {company._count.users} • Pedidos: {company._count.orders}</p>
              <p className="text-xs text-slate-500">Plano atual: {company.subscriptions[0]?.plan?.name || "Sem plano"} ({company.subscriptions[0]?.status || "-"})</p>
              <button className="btn-secondary mt-2" onClick={() => changeCompanyPlan(company.id, company.subscriptions[0]?.plan?.id)}>Trocar plano</button>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
