export const runtime = "nodejs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/format";
import { createSessionToken, getSessionCookieName } from "@/lib/session";
import { isSystemInitialized } from "@/lib/tenant";

async function onboardingAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const logoUrl = String(formData.get("logoUrl") || "").trim() || null;
  const primaryColor = String(formData.get("primaryColor") || "#6b2fa3").trim();
  const secondaryColor = String(formData.get("secondaryColor") || "#8e44cd").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const businessType = String(formData.get("businessType") || "").trim() || null;
  const slogan = String(formData.get("slogan") || "").trim() || null;

  const adminName = String(formData.get("adminName") || "").trim();
  const adminEmail = String(formData.get("adminEmail") || "").trim().toLowerCase();
  const adminPassword = String(formData.get("adminPassword") || "");

  if (!name || !adminEmail || !adminPassword || !adminName) {
    redirect("/onboarding?error=missing_fields");
  }

  const existing = await prisma.company.count();
  if (existing > 0) {
    redirect("/login");
  }

  const slug = slugify(name) || `empresa-${Date.now()}`;

  const company = await prisma.company.create({
    data: {
      slug,
      name,
      logoUrl,
      primaryColor,
      secondaryColor,
      phone,
      address,
      businessType,
      slogan
    }
  });

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name: adminName,
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN"
    }
  });

  const token = createSessionToken({
    userId: user.id,
    companyId: company.id,
    role: user.role,
    name: user.name,
    email: user.email
  });

  (await cookies()).set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });

  redirect("/dashboard");
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const initialized = await isSystemInitialized();
  if (initialized) redirect("/login");

  const params = await searchParams;
  const hasError = params.error === "missing_fields";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-8">
      <section className="panel w-full space-y-4">
        <div>
          <p className="text-sm text-slate-500">Configuração inicial</p>
          <h1 className="text-2xl font-bold">Onboarding da empresa</h1>
        </div>

        {hasError ? (
          <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">Preencha os campos obrigatórios.</p>
        ) : null}

        <form action={onboardingAction} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Nome da empresa *</label>
            <input name="name" className="input" required />
          </div>

          <div>
            <label className="mb-1 block text-sm">URL da logo</label>
            <input name="logoUrl" className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="mb-1 block text-sm">Categoria</label>
            <input name="businessType" className="input" placeholder="Açaíteria, Cafeteria..." />
          </div>

          <div>
            <label className="mb-1 block text-sm">Cor principal</label>
            <input name="primaryColor" type="color" className="input h-12" defaultValue="#6b2fa3" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Cor secundária</label>
            <input name="secondaryColor" type="color" className="input h-12" defaultValue="#8e44cd" />
          </div>

          <div>
            <label className="mb-1 block text-sm">Telefone</label>
            <input name="phone" className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Endereço</label>
            <input name="address" className="input" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Slogan</label>
            <input name="slogan" className="input" />
          </div>

          <div className="md:col-span-2 mt-4 border-t pt-4">
            <h2 className="font-semibold">Administrador inicial</h2>
          </div>

          <div>
            <label className="mb-1 block text-sm">Nome *</label>
            <input name="adminName" className="input" required />
          </div>
          <div>
            <label className="mb-1 block text-sm">E-mail *</label>
            <input name="adminEmail" type="email" className="input" required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Senha *</label>
            <input name="adminPassword" type="password" className="input" required />
          </div>

          <div className="md:col-span-2">
            <button className="btn-primary w-full" type="submit">
              Criar empresa e entrar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
