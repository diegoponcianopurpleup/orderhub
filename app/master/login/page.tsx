export const runtime = "nodejs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createMasterToken, getMasterCookieName } from "@/lib/master-session";
import { getMasterSession } from "@/lib/master-auth";

async function masterLoginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.platformUser.findUnique({ where: { email } });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    redirect("/master/login?error=invalid_credentials");
  }

  const token = createMasterToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email
  });

  (await cookies()).set(getMasterCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });

  redirect("/master/dashboard");
}

export default async function MasterLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getMasterSession();
  if (session) redirect("/master/dashboard");

  const params = await searchParams;
  const hasError = params.error === "invalid_credentials";

  return (
    <div className="mx-auto mt-10 max-w-md">
      <section className="panel space-y-4">
        <div>
          <p className="text-sm text-slate-500">Admin global</p>
          <h2 className="text-2xl font-bold">Entrar no painel master</h2>
        </div>

        {hasError ? <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">Credenciais inválidas.</p> : null}

        <form action={masterLoginAction} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">E-mail</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Senha</label>
            <input className="input" name="password" type="password" required />
          </div>
          <button className="btn-primary w-full" type="submit">Entrar</button>
        </form>
      </section>
    </div>
  );
}
