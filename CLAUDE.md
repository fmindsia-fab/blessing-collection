@AGENTS.md

# Blessing Collection — Guia para Claude Code

Catálogo digital (bolsas/acessórios artesanais) com painel administrativo e analytics simples. Ver `PLAN.md` para arquitetura completa e milestones. O PRD original (fornecido pelo usuário) é a fonte oficial de requisitos — este arquivo só resume regras operacionais permanentes.

## Stack

Next.js (App Router, TypeScript estrito) + Tailwind CSS + shadcn/ui + React Hook Form + Zod. Backend: Supabase (Postgres + Auth + Storage), SQL puro em migrations versionadas. Deploy: Vercel. **Sem Prisma ou outro ORM.**

## Regras inegociáveis

- **Nunca desativar RLS.** Toda tabela nova precisa de policies antes de ser usada.
- **`service_role_key` nunca no frontend** nem em código client-side. Variáveis sensíveis só no servidor, sem prefixo `NEXT_PUBLIC_`.
- **Sem exclusão definitiva.** "Excluir" no painel = `UPDATE status` (soft delete/arquivamento), nunca `DELETE`.
- **Sem dados pessoais em `analytics_events`**: nada de IP, user-agent, telefone, e-mail ou identificador de visitante.
- **Registro de analytics nunca bloqueia a navegação** — sempre fire-and-forget, com fallback silencioso em caso de falha.
- **WhatsApp só via link `wa.me`** com mensagem pré-formatada. Sem API oficial do WhatsApp.
- **Um usuário por loja.** Não implementar colaboradores, convites, RBAC ou múltiplos usuários — está fora do MVP.
- **Toda query filtra por `store_id` explicitamente**, mesmo havendo hoje uma única loja ativa — o schema é multiempresa desde o início.
- **Loja ativa é resolvida via `STORE_SLUG`** (variável de ambiente, não pública), centralizada em `lib/store/get-active-store.ts`. Nunca ler `process.env.STORE_SLUG` fora desse helper.
- **Não adicionar bibliotecas sem necessidade real.** Não implementar recursos fora do escopo do MVP sem aprovação explícita do usuário.

## Fluxo de trabalho

- Seguir os milestones do `PLAN.md` em ordem — não implementar tudo de uma vez.
- Cada mudança de schema é uma migration versionada em `supabase/migrations/`.
- Commits pequenos, um assunto por commit.
- Ao final do Milestone 3 (RLS) e do Milestone 7 (pré-publicação), rodar a skill `supabase-security-audit`.
- 1-3 testes críticos por milestone (não é necessário cobertura total) — ver `PLAN.md` seção 7 para os testes esperados de cada etapa.
- Antes de mudar o escopo definido no PRD/PLAN.md, perguntar ao usuário.

## Referência rápida

- Modelo de dados e RLS: `PLAN.md` seções 2-3.
- Rotas: `PLAN.md` seção 4 (públicas em `app/(public)/`, admin em `app/(admin)/`, protegidas por `proxy.ts` + RLS).
- Estratégia de analytics (rankings via RPC, sem N+1): `PLAN.md` seção 5.
- Riscos conhecidos a vigiar em code review: `PLAN.md` seção 9.
