"use client";

import { FormEvent, useState } from "react";

type CompanySettings = {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string | null;
  address: string | null;
  businessType: string | null;
  slogan: string | null;
  currency: string;
  darkMode: boolean;
};

export function SettingsForm({ initial }: { initial: CompanySettings }) {
  const [form, setForm] = useState({
    ...initial,
    logoUrl: initial.logoUrl || "",
    phone: initial.phone || "",
    address: initial.address || "",
    businessType: initial.businessType || "",
    slogan: initial.slogan || ""
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <article className="panel" style={{ borderColor: form.primaryColor }}>
        <p className="mb-2 text-xs uppercase text-slate-500">Pré-visualização da marca</p>
        <div className="flex items-center gap-3">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="Logo da empresa" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: form.primaryColor }}>
              {form.name ? form.name.slice(0, 2).toUpperCase() : "LG"}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold">{form.name || "Nome da empresa"}</h3>
            <p className="text-sm text-slate-500">{form.slogan || "Seu slogan aparecerá aqui"}</p>
          </div>
        </div>
      </article>

      <form className="panel grid gap-3 md:grid-cols-2" onSubmit={saveSettings}>
        <div>
          <label className="mb-1 block text-sm">Nome da empresa</label>
          <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Logo (URL)</label>
          <input className="input" value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm">Slogan</label>
          <input className="input" value={form.slogan} onChange={(e) => setForm((p) => ({ ...p, slogan: e.target.value }))} />
        </div>

        <div>
          <label className="mb-1 block text-sm">Cor principal</label>
          <input className="input h-12" type="color" value={form.primaryColor} onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Cor secundária</label>
          <input className="input h-12" type="color" value={form.secondaryColor} onChange={(e) => setForm((p) => ({ ...p, secondaryColor: e.target.value }))} />
        </div>

        <div>
          <label className="mb-1 block text-sm">Telefone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Endereço</label>
          <input className="input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        </div>

        <div>
          <label className="mb-1 block text-sm">Categoria do negócio</label>
          <input className="input" value={form.businessType} onChange={(e) => setForm((p) => ({ ...p, businessType: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Moeda</label>
          <input className="input" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
        </div>

        <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
          <input type="checkbox" checked={form.darkMode} onChange={(e) => setForm((p) => ({ ...p, darkMode: e.target.checked }))} />
          Ativar modo escuro
        </label>

        <button className="btn-primary md:col-span-2" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>

        {saved ? <p className="md:col-span-2 text-sm text-emerald-600">Configurações salvas com sucesso.</p> : null}
      </form>
    </div>
  );
}
