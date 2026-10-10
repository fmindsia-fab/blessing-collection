import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Único ponto do projeto que decide qual é a loja ativa. Nunca ler
// process.env.STORE_SLUG nem o header de tenant fora daqui.
//
// TENANT_RESOLUTION_MODE controla a fonte do slug durante a migração para
// multi-tenant por host (ver Milestone 1 do plano de evolução SaaS):
// - "env" (padrão atual): slug fixo via STORE_SLUG, um deploy = uma loja.
// - "host": slug resolvido a partir do host da requisição, propagado pelo
//   proxy.ts via header interno. Ainda não implementado — ligar apenas após
//   o Milestone 1 estar pronto e validado em staging.
async function resolveStoreSlug(): Promise<string> {
  const mode = process.env.TENANT_RESOLUTION_MODE ?? "env";

  if (mode === "host") {
    throw new Error(
      "TENANT_RESOLUTION_MODE=host ainda não suportado — resolução por host entra no Milestone 1.",
    );
  }

  const slug = process.env.STORE_SLUG;
  if (!slug) {
    throw new Error("STORE_SLUG não definido no ambiente");
  }
  return slug;
}

export const getActiveStore = cache(async () => {
  const slug = await resolveStoreSlug();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    throw new Error(`Loja ativa não encontrada para slug="${slug}"`);
  }

  return data;
});
