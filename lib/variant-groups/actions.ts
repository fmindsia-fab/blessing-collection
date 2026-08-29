"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";

const groupSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do grupo").max(30),
});

export type VariantGroupFormState = {
  error?: string;
};

function revalidate() {
  revalidatePath("/admin/grupos-variacao");
  // A tela de edição da peça lista os grupos no datalist — precisa refletir
  // um grupo novo/removido sem exigir reload manual.
  revalidatePath("/admin/produtos", "layout");
}

export async function createVariantGroup(
  _prevState: VariantGroupFormState,
  formData: FormData,
): Promise<VariantGroupFormState> {
  const parsed = groupSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  const { count } = await supabase
    .from("variant_groups")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { error } = await supabase.from("variant_groups").insert({
    store_id: store.id,
    name: parsed.data.name,
    sort_order: count ?? 0,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Já existe um grupo com esse nome." : "Não foi possível criar o grupo.",
    };
  }

  revalidate();
  return {};
}

export async function renameVariantGroup(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 30) return;

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  await supabase
    .from("variant_groups")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("store_id", store.id);

  revalidate();
}

// "Excluir" no painel é sempre soft delete via status. Arquivar tira o grupo
// da sugestão de peça nova, mas não desfaz o texto já gravado em
// product_variants.variant_group nas peças que já o usam (é texto livre,
// sem vínculo direto com esta tabela — arquivar aqui não quebra nada lá).
export async function archiveVariantGroup(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("variant_groups").update({ status: "archived" }).eq("id", id).eq("store_id", store.id);
  revalidate();
}

export async function restoreVariantGroup(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("variant_groups").update({ status: "active" }).eq("id", id).eq("store_id", store.id);
  revalidate();
}
