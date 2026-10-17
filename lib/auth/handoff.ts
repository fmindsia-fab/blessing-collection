import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPlatformServiceClient } from "@/lib/platform/service-role-client";

// Repasse de login do domínio principal para o subdomínio da loja.
//
// A sessão é POR HOST (de propósito: um cookie `.atelifacil.com.br` faria uma
// falha de script em qualquer loja expor a sessão do administrador da
// plataforma). Para o dono não digitar a senha de novo ao ir para o painel da
// loja, o servidor gera um link de uso único (magic link, SEM enviar e-mail)
// que o subdomínio troca por uma sessão em /auth/confirm.
//
// Segurança: o link é gerado só para o e-mail do USUÁRIO LOGADO e só para a
// loja DELE (slug lido do banco, nunca da requisição); o destino é fixo
// (/admin); o token vale uma vez e expira.

export type HandoffResult =
  | { kind: "ok"; url: string }
  | { kind: "no-session" }
  | { kind: "no-store" }
  | { kind: "unavailable"; fallbackUrl: string | null };

export async function buildStoreHandoff(): Promise<HandoffResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { kind: "no-session" };

  // Um usuário por loja; se houver mais de uma (legado), a mais antiga.
  const { data: store } = await supabase
    .from("stores")
    .select("slug")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return { kind: "no-store" };

  const platformDomain = process.env.PLATFORM_DOMAIN;
  if (!platformDomain) return { kind: "unavailable", fallbackUrl: null };

  const storeOrigin = `https://${store.slug}.${platformDomain}`;
  const plainUrl = `${storeOrigin}/admin`;

  try {
    const { data, error } = await createPlatformServiceClient().auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      console.error("[buildStoreHandoff] generateLink", error?.message);
      return { kind: "unavailable", fallbackUrl: plainUrl };
    }

    const url = new URL("/auth/confirm", storeOrigin);
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", "magiclink");
    url.searchParams.set("next", "/admin");
    return { kind: "ok", url: url.toString() };
  } catch (err) {
    console.error("[buildStoreHandoff]", err);
    return { kind: "unavailable", fallbackUrl: plainUrl };
  }
}
