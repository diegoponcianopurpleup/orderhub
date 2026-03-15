# OrderHub Core

Base profissional white-label para gestão de pedidos, comandas e vendas, preparada para monetização SaaS.

## 1. Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (dev local), pronta para PostgreSQL

## 2. Funcionalidades entregues
- Onboarding white-label da empresa
- Login/logout empresa
- Dashboard com métricas
- Produtos, categorias, complementos, clientes
- Pedidos/comandas completos
- Relatórios por período
- Configurações de empresa (tema, dados, moeda, modo escuro)
- Painel master SaaS (planos, empresas, assinatura)
- Planos/assinatura com cobrança desativada por padrão no dev

## 3. Cobrança desativada por padrão
No arquivo `.env`:
```env
BILLING_ENABLED=false
BILLING_PROVIDER=mock
```

Com `BILLING_ENABLED=false`:
- o sistema cria assinatura e fatura normalmente;
- não executa cobrança real;
- registra `externalRef=billing-disabled`.

## 4. Estrutura de pastas
```text
New project/
  app/
    (auth)/login/page.tsx
    onboarding/page.tsx
    (dashboard)/
      layout.tsx
      dashboard/page.tsx
      orders/page.tsx
      products/page.tsx
      addons/page.tsx
      categories/page.tsx
      customers/page.tsx
      reports/page.tsx
      settings/page.tsx
    master/
      layout.tsx
      page.tsx
      login/page.tsx
      dashboard/page.tsx
    api/
      auth/login/route.ts
      auth/logout/route.ts
      products/route.ts
      products/[id]/route.ts
      addons/route.ts
      addons/[id]/route.ts
      categories/route.ts
      categories/[id]/route.ts
      customers/route.ts
      customers/[id]/route.ts
      orders/route.ts
      orders/[id]/route.ts
      settings/route.ts
      settings/subscription/route.ts
      master/
        auth/login/route.ts
        auth/logout/route.ts
        plans/route.ts
        plans/[id]/route.ts
        companies/route.ts
        companies/[id]/subscription/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    forms/
      addon-manager.tsx
      category-manager.tsx
      customer-manager.tsx
      master-panel.tsx
      order-manager.tsx
      product-manager.tsx
      settings-form.tsx
    layout/
      sidebar.tsx
      top-header.tsx
  lib/
    actions.ts
    api-auth.ts
    auth.ts
    billing.ts
    constants.ts
    decimal.ts
    format.ts
    master-actions.ts
    master-auth.ts
    master-session.ts
    password.ts
    prisma.ts
    session.ts
    tenant.ts
    types.ts
    utils.ts
  prisma/
    schema.prisma
    seed.ts
  public/
  .env.example
  .gitignore
  middleware.ts
  next-env.d.ts
  next.config.mjs
  package.json
  postcss.config.mjs
  tailwind.config.ts
  tsconfig.json
  README.md
```

## 5. Instalar Node.js (passo a passo)

## Windows
1. Acesse [https://nodejs.org/en/download](https://nodejs.org/en/download)
2. Baixe o instalador LTS (`.msi`)
3. Execute o instalador e avance com as opções padrão
4. Feche e abra o PowerShell novamente
5. Verifique:
```powershell
node -v
npm -v
```

## macOS
1. Acesse [https://nodejs.org/en/download](https://nodejs.org/en/download)
2. Baixe o instalador LTS (`.pkg`) e instale
3. Verifique no Terminal:
```bash
node -v
npm -v
```

## Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y nodejs npm
node -v
npm -v
```

## 6. Instalar dependências
Na pasta do projeto:
```bash
npm install
```

## 7. Configurar ambiente
```bash
# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

## 8. Rodar migrate
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## 9. Popular dados iniciais (seed)
```bash
npm run db:seed
```

## 10. Iniciar sistema localmente
```bash
npm run dev
```
Abra: [http://localhost:3000](http://localhost:3000)

## 11. Credenciais de seed
- Empresa demo: `admin@demo.com` / `123456`
- Master global: `master@orderhub.com` / `123456`

## 12. Rotas principais
- Empresa: `/login`, `/dashboard`
- Onboarding inicial: `/onboarding`
- Master SaaS: `/master/login`, `/master/dashboard`

## 13. Evolução para produção SaaS
1. Migrar SQLite para PostgreSQL
2. Implementar provider real de cobrança em `lib/billing.ts`
3. Ativar `BILLING_ENABLED=true` em produção
4. Implementar renovação automática de faturas
5. Multi-tenant por subdomínio
6. RBAC completo e auditoria

## 14. Checklist de deploy (producao)
- Definir `DATABASE_URL` de banco gerenciado (PostgreSQL recomendado).
- Definir `SESSION_SECRET` forte (>= 32 caracteres).
- Definir `APP_URL` com URL publica (ex.: `https://app.sualoja.com`).
- Executar migracoes com `npm run prisma:migrate:deploy`.
- Iniciar app com `npm run build` e `npm run start`.

## 15. Caminho simples para publicar online
1. Subir repositório no GitHub.
2. Criar banco PostgreSQL gerenciado (Neon, Supabase ou Railway).
3. Publicar no Vercel.
4. Configurar variaveis no painel da Vercel:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `APP_URL`
   - `BILLING_ENABLED=false`
   - `BILLING_PROVIDER=mock`
5. Rodar `npm run prisma:migrate:deploy` no ambiente de deploy.
6. (Opcional) rodar seed inicial para ambiente demo.

## 16. O que falta para SaaS completo multi-loja
- Login com contexto explicito da loja (slug/subdominio) para evitar ambiguidade de e-mails repetidos entre empresas.
- Migração definitiva de SQLite local para PostgreSQL em todos ambientes.
- Domínios/subdomínios por tenant (multi-tenant por host).
- Observabilidade e backup automatizado de banco.
