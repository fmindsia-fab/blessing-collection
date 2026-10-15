"use server";

import { createStoreSchema } from "@/lib/onboarding/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CreateStoreFormState = {
  error?: string;
  success?: boolean;
  storeSlug?: string;
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
    ownerCpf: formData.get("ownerCpf"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    whatsappNumber: formData.get("whatsappNumber"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // profiles.id = auth.uid() (RLS profile_insert_own / profile_update_own).
  // Upsert porque o perfil pode ou não existir ainda para este usuário.
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: parsed.data.ownerName,
    cpf: parsed.data.ownerCpf,
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
    })
    .select("slug")
    .single();

  if (error) {
    // 23505 = unique_violation (índice idx_stores_slug) — a checagem de
    // disponibilidade no client roda antes do submit, mas duas pessoas
    // podem tentar o mesmo slug ao mesmo tempo; o banco é a fonte da verdade.
    if (error.code === "23505") {
      return { error: "Esse nome já está em uso. Escolha outro." };
    }
    return { error: "Não foi possível criar a loja. Tente novamente." };
  }

  return { success: true, storeSlug: data.slug };
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
