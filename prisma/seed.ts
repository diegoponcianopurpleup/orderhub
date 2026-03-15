import {
  InvoiceStatus,
  PaymentMethod,
  PlanInterval,
  PrismaClient,
  SubscriptionStatus,
  OrderStatus,
  OrderType,
  PlatformRole,
  UserRole
} from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const starterPlan = await prisma.plan.upsert({
    where: { code: "starter" },
    update: {},
    create: {
      code: "starter",
      name: "Starter",
      description: "Plano básico para operações pequenas",
      interval: PlanInterval.MONTHLY,
      price: 99,
      maxUsers: 3,
      maxOrdersPerMonth: 2000,
      isActive: true
    }
  });

  await prisma.platformUser.upsert({
    where: { email: "master@orderhub.com" },
    update: {},
    create: {
      email: "master@orderhub.com",
      name: "Master Admin",
      passwordHash: hashPassword("123456"),
      role: PlatformRole.SUPER_ADMIN
    }
  });

  let company = await prisma.company.findUnique({ where: { slug: "demo-company" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        slug: "demo-company",
        name: "OrderHub Demo",
        slogan: "Operacao inteligente para food service",
        businessType: "Lanchonete",
        phone: "(11) 99999-9999",
        address: "Rua Exemplo, 123",
        primaryColor: "#6b2fa3",
        secondaryColor: "#8e44cd"
      }
    });
  }

  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: "admin@demo.com" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Admin",
      email: "admin@demo.com",
      passwordHash: hashPassword("123456"),
      role: UserRole.ADMIN
    }
  });

  const subscriptionExists = await prisma.subscription.findFirst({ where: { companyId: company.id } });
  if (!subscriptionExists) {
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: starterPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startsAt: start,
        currentPeriodStart: start,
        currentPeriodEnd: end
      }
    });

    await prisma.invoice.create({
      data: {
        companyId: company.id,
        planId: starterPlan.id,
        amount: 99,
        status: InvoiceStatus.PAID,
        dueDate: start,
        paidAt: start,
        currency: "BRL"
      }
    });
  }

  const categoryCount = await prisma.category.count({ where: { companyId: company.id } });
  if (categoryCount === 0) {
    const catAcai = await prisma.category.create({ data: { companyId: company.id, name: "Açaí", position: 1 } });
    const catBebidas = await prisma.category.create({ data: { companyId: company.id, name: "Bebidas", position: 2 } });

    const acai550 = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: catAcai.id,
        name: "Açaí 550ml",
        description: "Açaí tradicional",
        price: 20,
        position: 1
      }
    });

    const suco = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: catBebidas.id,
        name: "Suco Natural",
        description: "Laranja 400ml",
        price: 10,
        position: 2
      }
    });

    const granola = await prisma.addon.create({ data: { companyId: company.id, name: "Granola", price: 2 } });
    const leitePo = await prisma.addon.create({ data: { companyId: company.id, name: "Leite em pó", price: 2.5 } });

    await prisma.productAddon.createMany({
      data: [
        { productId: acai550.id, addonId: granola.id },
        { productId: acai550.id, addonId: leitePo.id },
        { productId: suco.id, addonId: granola.id }
      ]
    });

    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: "Cliente Exemplo",
        phone: "(11) 98888-7777"
      }
    });

    await prisma.order.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        code: "CMD-001",
        orderType: OrderType.COUNTER,
        status: OrderStatus.COMPLETED,
        subtotal: 24.5,
        total: 24.5,
        completedAt: new Date(),
        items: {
          create: [
            {
              productId: acai550.id,
              productName: acai550.name,
              unitPrice: 20,
              quantity: 1,
              subtotal: 20,
              addons: {
                create: [
                  { addonId: granola.id, addonName: granola.name, unitPrice: 2, quantity: 1, subtotal: 2 },
                  { addonId: leitePo.id, addonName: leitePo.name, unitPrice: 2.5, quantity: 1, subtotal: 2.5 }
                ]
              }
            }
          ]
        },
        payments: {
          create: [{ method: PaymentMethod.PIX, amount: 24.5 }]
        }
      }
    });
  }

  console.log("Seed concluído", {
    company: "admin@demo.com / 123456",
    master: "master@orderhub.com / 123456"
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
