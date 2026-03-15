import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@demo.com";
  const newPassword = "admin123";

  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    console.error(`Usuário ${email} não encontrado.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword), isActive: true }
  });

  console.log(`Senha resetada com sucesso para ${email}.`);
  console.log(`Nova senha: ${newPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
