"use server";

import { createStoreSchema } from "@/lib/onboarding/schema";
import { marketplaceExtrasColumns, toCraftProfileColumns } from "@/lib/store/craft-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildStoreHandoff } from "@/lib/auth/handoff";

export type CreateStoreFormState = {
  error?: string;
  success?: boolean;
  storeSlug?: string;
  // Destino pós-criação: painel da loja já autenticado (repasse), ou o simples.
  redirectUrl?: string;
};

// A loja criada aqui pertence sempre ao usuário autenticado na sessão atual
// (auth.uid()), nunca a um id vindo do formulário — mesma garantia que
// updateStoreSettings já segue para edição. RLS (stores_owner_all) é quem
// de fato impede o insert em nome de outra pessoa; isto é defesa em
// profundidade, não a única barreira.
export async function createStore(
  _prevState: CreateStoreFormState,
  formData: FormData,
): Promise<CreateStoreFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sua sessão expirou. Entre novamente para criar a loja." };
  }

  const parsed = createStoreSchema.safeParse({
    ownerName: formData.get("ownerName"),
    ownerDocument: formData.get("ownerDocument"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    whatsappNumber: formData.get("whatsappNumber"),
    city: formData.get("city"),
    state: formData.get("state"),
    craftTypes: formData.getAll("craftTypes"),
    craftOther: formData.get("craftOther") ?? undefined,
    description: String(formData.get("description") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    acceptsCustomOrders: String(formData.get("acceptsCustomOrders") ?? ""),
    shipsNationwide: String(formData.get("shipsNationwide") ?? ""),
    yearsActive: String(formData.get("yearsActive") ?? ""),
    marketplaceOptIn: formData.get("marketplaceOptIn") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Um usuário por loja: checa ANTES de gravar qualquer coisa (o perfil abaixo
  // não deve ser alterado por quem não vai criar loja). O banco também garante
  // (stores_owner_user_id_unique, migration 0039); aqui é só a mensagem amigável.
  const { data: existingStore } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existingStore) {
    return { error: "Você já tem uma loja cadastrada. Entre no painel dela." };
  }

  // profiles.id = auth.uid() (RLS profile_insert_own / profile_update_own).
  // Upsert porque o perfil pode ou não existir ainda para este usuário.
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: parsed.data.ownerName,
    document: parsed.data.ownerDocument,
  });
  if (profileError) {
    return { error: "Não foi possível salvar seus dados. Tente novamente." };
  }

  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_user_id: user.id,
      slug: parsed.data.slug,
      name: parsed.data.name,
      whatsapp_number: parsed.data.whatsappNumber,
      ...toCraftProfileColumns(parsed.data),
      ...marketplaceExtrasColumns(parsed.data),
      description: parsed.data.description || null,
      instagram_url: parsed.data.instagramUrl,
    })
    .select("slug")
    .single();

  if (error) {
    // 23505 = unique_violation (índice idx_stores_slug) — a checagem de
    // disponibilidade no client roda antes do submit, mas duas pessoas
    // podem tentar o mesmo slug ao mesmo tempo; o banco é a fonte da verdade.
    if (error.code === "23505") {
      // Corrida entre duas criações do mesmo usuário (a trava é a do dono).
      if (error.message?.includes("owner_user_id")) {
        return { error: "Você já tem uma loja cadastrada. Entre no painel dela." };
      }
      return { error: "Esse nome já está em uso. Escolha outro." };
    }
    // Erro real só no log do servidor (nunca para o usuário): sem isto, uma falha
    // de RLS/constraint em produção seria indistinguível de qualquer outra.
    console.error("[createStore]", error.code, error.message, error.details);
    return { error: "Não foi possível criar a loja. Tente novamente." };
  }

  const handoff = await buildStoreHandoff();
  const redirectUrl = handoff.kind === "ok" ? handoff.url : handoff.kind === "unavailable" ? handoff.fallbackUrl : null;

  return { success: true, storeSlug: data.slug, redirectUrl: redirectUrl ?? undefined };
}

// Checagem amigável de disponibilidade antes do submit (UX instantânea);
// o insert acima é quem de fato garante a unicidade via índice do banco.
// Usa RPC (security definer) porque a RLS pública só enxerga lojas ativas —
// um select direto deixaria passar colisão com uma loja inativa.
export async function checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("is_store_slug_available", { p_slug: slug });
  if (error) return { available: false };
  return { available: data ?? false };
}
