import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

// Único ponto do projeto que decide qual é a loja ativa. Nunca ler
// process.env.STORE_SLUG, PLATFORM_DOMAIN nem os headers x-tenant-* fora
// daqui — proxy.ts só parseia o host bruto e repassa o resultado já pronto.
//
// TENANT_RESOLUTION_MODE controla a fonte do slug (ver Milestone 1 do plano
// de evolução SaaS):
// - "env" (padrão atual): slug fixo via STORE_SLUG, um deploy = uma loja.
// - "host": slug/domínio resolvido a partir do host da requisição, via
//   headers propagados pelo proxy.ts (x-tenant-slug / x-tenant-domain).
async function findStoreBySlug(supabase: Supabase, slug: string) {
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

async function findStoreByDomain(supabase: Supabase, domain: string) {
  const { data: domainRow } = await supabase
    .from("store_domains")
    .select("store_id")
    .eq("domain", domain)
    .maybeSingle();
  if (!domainRow) return null;

  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("id", domainRow.store_id)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

// true só quando a requisição é para o apex/www da própria plataforma (ex.
// atelifacil.com.br), onde não existe "a loja ativa" — é a área de marketing/
// cadastro, não o catálogo de ninguém. No modo "env" nunca é true: sempre há
// exatamente uma loja servida pelo deploy.
export async function isPlatformRequest(): Promise<boolean> {
  if ((process.env.TENANT_RESOLUTION_MODE ?? "env") !== "host") return false;
  const headerList = await headers();
  return headerList.get("x-tenant-none") === "1";
}

export const getActiveStore = cache(async () => {
  const mode = process.env.TENANT_RESOLUTION_MODE ?? "env";
  const supabase = await createServerSupabaseClient();

  if (mode === "host") {
    // headers() torna a rota dinâmica automaticamente (opta-out de qualquer
    // pré-renderização estática do Next) — por isso toda página pública que
    // chama getActiveStore() já fica imune a cache cruzado entre tenants,
    // sem precisar de force-dynamic manual em cada page.tsx.
    const headerList = await headers();
    const tenantSlug = headerList.get("x-tenant-slug");
    const tenantDomain = headerList.get("x-tenant-domain");

    const store = tenantSlug
      ? await findStoreBySlug(supabase, tenantSlug)
      : tenantDomain
        ? await findStoreByDomain(supabase, tenantDomain)
        : null;

    if (!store) notFound();
    return store;
  }

  const slug = process.env.STORE_SLUG;
  if (!slug) {
    throw new Error("STORE_SLUG não definido no ambiente");
  }

  const store = await findStoreBySlug(supabase, slug);
  if (!store) {
    throw new Error(`Loja ativa não encontrada para slug="${slug}"`);
  }
  return store;
});
