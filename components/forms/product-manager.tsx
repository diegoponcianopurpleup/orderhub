"use client";

import { FormEvent, useState } from "react";
import { Category, Product } from "@/lib/types";
import { toMoney } from "@/lib/format";

type Props = {
  initialProducts: Product[];
  categories: Category[];
};

export function ProductManager({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: 0,
    categoryId: "",
    position: 0
  });

  async function refresh() {
    const data = await fetch("/api/products", { cache: "no-store" }).then((r) => r.json());
    setProducts(
      data.map((item: any) => ({
        ...item,
        price: Number(item.price)
      }))
    );
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryId: form.categoryId || null,
        isActive: true,
        outOfStock: false
      })
    });

    setForm({ name: "", description: "", imageUrl: "", price: 0, categoryId: "", position: 0 });
    await refresh();
  }

  async function editProduct(product: Product) {
    const name = window.prompt("Nome", product.name);
    if (name === null) return;

    const price = window.prompt("Preço", String(product.price));
    if (price === null) return;

    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: Number(price) })
    });

    await refresh();
  }

  async function toggleStock(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outOfStock: !product.outOfStock })
    });
    await refresh();
  }

  async function toggleActive(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive })
    });
    await refresh();
  }

  async function removeProduct(product: Product) {
    if (!window.confirm("Excluir produto?")) return;
    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <section className="space-y-4">
      <form className="panel grid gap-3 md:grid-cols-3" onSubmit={createProduct}>
        <div>
          <label className="mb-1 block text-sm">Nome</label>
          <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Preço</label>
          <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Categoria</label>
          <select className="input" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}>
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm">Descrição</label>
          <input className="input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Ordem</label>
          <input className="input" type="number" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: Number(e.target.value) }))} />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-sm">URL da imagem (opcional)</label>
          <input className="input" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
        </div>

        <button className="btn-primary md:col-span-3" type="submit">Adicionar produto</button>
      </form>

      <div className="space-y-2">
        {products.map((product) => (
          <article key={product.id} className="panel flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-xs text-slate-500">{toMoney(product.price)} • {product.category?.name || "Sem categoria"}</p>
              <p className="text-xs text-slate-500">
                Status: {product.isActive ? "Ativo" : "Inativo"} • Estoque: {product.outOfStock ? "Em falta" : "Disponível"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => editProduct(product)}>Editar</button>
              <button className={product.outOfStock ? "btn-primary" : "btn-danger"} onClick={() => toggleStock(product)}>
                {product.outOfStock ? "Disponível" : "Em falta"}
              </button>
              <button className={product.isActive ? "btn-secondary" : "btn-primary"} onClick={() => toggleActive(product)}>
                {product.isActive ? "Desativar" : "Ativar"}
              </button>
              <button className="btn-danger" onClick={() => removeProduct(product)}>Excluir</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

