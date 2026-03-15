export const runtime = "nodejs";
import { requireSession, getCurrentCompany } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  const company = await getCurrentCompany();

  return (
    <div
      className={company.darkMode ? "dark min-h-screen" : "min-h-screen"}
      style={{
        ["--primary" as string]: company.primaryColor,
        ["--secondary" as string]: company.secondaryColor
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[260px_1fr]">
        <Sidebar companyName={company.name} />
        <main>
          <TopHeader name={company.name} logoUrl={company.logoUrl} slogan={company.slogan} />
          {children}
        </main>
      </div>
    </div>
  );
}

