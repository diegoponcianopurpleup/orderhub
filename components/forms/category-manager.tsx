"use client";

import { FormEvent, useState } from "react";
import { Category } from "@/lib/types";

type Props = {
  initialCategories: Category[];
};

export function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(
    Array.isArray(initialCategories) ? initialCategories : []
  );
  const [name, setName] = useState("");
  const [position, setPosition] = useState(0);

  async function refresh() {
    const data = await fetch("/api/categories", { cache: "no-store" }).then((r) => r.json());
    setCategories(Array.isArray(data) ? data : []);
  }

  async function createCategory(e: FormEvent) {
    e.preventDefault();

    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        position,
        isActive: true,
      }),
    });

    setName("");
    setPosition(0);
    await refresh();
  }

  async function editCategory(category: Category) {
    const nextName = window.prompt("Nome da categoria", category.name);
    if (nextName === null) return;

    const nextPosition = window.prompt("Ordem", String(category.position));
    if (nextPosition === null) return;

    await fetch("/api/categories/" + category.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nextName,
        position: Number(nextPosition),
        isActive: category.isActive,
      }),
    });

    await refresh();
  }

  async function toggleActive(category: Category) {
    await fetch("/api/categories/" + category.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isActive: !category.isActive,
      }),
    });

    await refresh();
  }

  async function removeCategory(category: Category) {
    if (!window.confirm("Excluir categoria?")) return;

   await fetch("/api/categories/" + category.id, {
      method: "DELETE",
    });

    await refresh();
  }

  return (
    <section className="space-y-4">
      <form onSubmit={createCategory} className="panel grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm">Nome</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Ordem</label>
          <input
            className="input"
            type="number"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            required
          />
        </div>

        <button className="btn-primary h-fit self-end" type="submit">
          Adicionar categoria
        </button>
      </form>

      <div className="space-y-2">
        {Array.isArray(categories) && categories.length > 0 ? (
          categories.map((category) => (
            <article
              key={category.id}
              className="panel flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-xs text-slate-500">Ordem: {category.position}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => editCategory(category)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className={category.isActive ? "btn-danger" : "btn-primary"}
                  onClick={() => toggleActive(category)}
                >
                  {category.isActive ? "Desativar" : "Ativar"}
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removeCategory(category)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="panel text-sm text-slate-500">Nenhuma categoria cadastrada.</div>
        )}
      </div>
    </section>
  );
}