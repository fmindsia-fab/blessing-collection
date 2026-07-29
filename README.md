# Blessing Collection

Catálogo digital da Blessing Collection, preparado para evolução futura como SaaS para artesãs.

Ver [PLAN.md](./PLAN.md) para arquitetura completa, modelo de dados, políticas de RLS e milestones de desenvolvimento. Ver [CLAUDE.md](./CLAUDE.md) para regras operacionais permanentes do projeto.

## Stack

Next.js (App Router, TypeScript estrito) + Tailwind CSS + shadcn/ui + Supabase (Postgres, Auth, Storage) + Vercel.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local  # preencher com as credenciais do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).
