"use client";

import { FormEvent, useState } from "react";
import { Addon, Product } from "@/lib/types";
import { toMoney } from "@/lib/format";

type Props = {
  initialAddons: Addon[];
  products: Product[];
};

export function AddonManager({ initialAddons, products }: Props) {
  const [addons, setAddons] = useState<Addon[]>(initialAddons);
  const [form, setForm] = useState({ name: "", price: 0, productIds: [] as string[] });

  async function refresh() {
    const data = await fetch("/api/addons", { cache: "no-store" }).then((r) => r.json());
    setAddons(
      data.map((item: any) => ({
        ...item,
        price: Number(item.price)
      }))
    );
  }

  async function createAddon(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isActive: true, outOfStock: false })
    });

    setForm({ name: "", price: 0, productIds: [] });
    await refresh();
  }

  async function editAddon(addon: Addon) {
    const name = window.prompt("Nome", addon.name);
    if (name === null) return;
    const price = window.prompt("Preço", String(addon.price));
    if (price === null) return;

    await fetch(`/api/addons/${addon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: Number(price) })
    });
    await refresh();
  }

  async function toggleStock(addon: Addon) {
    await fetch(`/api/addons/${addon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outOfStock: !addon.outOfStock })
    });
    await refresh();
  }

  async function toggleActive(addon: Addon) {
    await fetch(`/api/addons/${addon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !addon.isActive })
    });
    await refresh();
  }

  async function removeAddon(addon: Addon) {
    if (!window.confirm("Excluir complemento?")) return;
    await fetch(`/api/addons/${addon.id}`, { method: "DELETE" });
    await refresh();
  }

  function toggleProductSelection(productId: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId]
    }));
  }

  return (
    <section className="space-y-4">
      <form className="panel space-y-3" onSubmit={createAddon}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Nome</label>
            <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Preço</label>
            <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm">Associar a produtos (opcional)</p>
          <div className="grid gap-2 md:grid-cols-3">
            {products.map((product) => (
              <label key={product.id} className="flex items-center gap-2 rounded-xl border p-2 text-sm">
                <input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => toggleProductSelection(product.id)} />
                {product.name}
              </label>
            ))}
          </div>
        </div>

        <button className="btn-primary" type="submit">Adicionar complemento</button>
      </form>

      <div className="space-y-2">
        {addons.map((addon) => (
          <article key={addon.id} className="panel flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{addon.name}</h3>
              <p className="text-xs text-slate-500">{toMoney(addon.price)}</p>
              <p className="text-xs text-slate-500">
                Status: {addon.isActive ? "Ativo" : "Inativo"} • Estoque: {addon.outOfStock ? "Em falta" : "Disponível"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => editAddon(addon)}>Editar</button>
              <button className={addon.outOfStock ? "btn-primary" : "btn-danger"} onClick={() => toggleStock(addon)}>
                {addon.outOfStock ? "Disponível" : "Em falta"}
              </button>
              <button className={addon.isActive ? "btn-secondary" : "btn-primary"} onClick={() => toggleActive(addon)}>
                {addon.isActive ? "Desativar" : "Ativar"}
              </button>
              <button className="btn-danger" onClick={() => removeAddon(addon)}>Excluir</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

