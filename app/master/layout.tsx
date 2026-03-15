import Link from "next/link";

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase text-slate-500">OrderHub Cloud</p>
            <h1 className="text-lg font-bold">Painel Master</h1>
          </div>
          <nav className="flex gap-2 text-sm">
            <Link className="btn-secondary" href="/master/dashboard">Dashboard</Link>
            <Link className="btn-secondary" href="/master/login">Login</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4">{children}</main>
    </div>
  );
}
