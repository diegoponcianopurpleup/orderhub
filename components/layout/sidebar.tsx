"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Pedidos" },
  { href: "/kitchen", label: "Cozinha" },
  { href: "/products", label: "Produtos" },
  { href: "/addons", label: "Complementos" },
  { href: "/categories", label: "Categorias" },
  { href: "/customers", label: "Clientes" },
  { href: "/reports", label: "Relatórios" },
  { href: "/settings", label: "Configurações" }
];

export function Sidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  return (
    <aside className="panel h-fit lg:sticky lg:top-4">
      <p className="text-xs uppercase text-slate-500">Empresa</p>
      <h2 className="mb-4 text-lg font-bold">{companyName}</h2>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition",
              pathname === item.href
                ? "bg-brand-600 text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

