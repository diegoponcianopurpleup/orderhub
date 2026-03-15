import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new Error("Senha inválida");
  }

  redirect("/dashboard");
}

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <form action={loginAction} className="bg-white p-6 rounded shadow w-80 space-y-4">
        <h1 className="text-xl font-bold">Login</h1>

        <input
          name="email"
          placeholder="email"
          className="border p-2 w-full"
        />

        <input
          name="password"
          type="password"
          placeholder="senha"
          className="border p-2 w-full"
        />

        <button
          type="submit"
          className="bg-black text-white p-2 w-full rounded"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}