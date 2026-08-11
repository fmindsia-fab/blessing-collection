"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";

const variantSchema = z.object({
  name: z.string().min(1, "Informe o nome da variação"),
  // Cor vem do cadastro (migration 0013). O campo de texto livre criava
  // "Rose"/"Rosé" como cores distintas no filtro público.
  colorId: z
    .union([z.literal(""), z.uuid("Cor inválida")])
    .optional()
    .transform((value) => value || null),
  size: z.string().optional(),
  price: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  status: z.enum(["available", "sold_out"]),
});

export type VariantFormState = {
  error?: string;
};

// O productId chega do formulário, então nunca confiar nele direto: confirma
// que o produto pertence à loja ativa antes de qualquer escrita na variante.
// A RLS já bloquearia, mas a checagem explícita é a defesa da aplicação
// (regra do CLAUDE.md: toda query filtra por store_id).
async function assertProductBelongsToStore(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  productId: string,
) {
  const store = await getActiveStore();
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();

  return data !== null;
}

export async function createVariant(
  productId: string,
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const parsed = variantSchema.safeParse({
    name: formData.get("name"),
    colorId: formData.get("colorId") ?? "",
    size: formData.get("size"),
    price: formData.get("price") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  // O id da cor vem do formulário: confirma que é da loja ativa antes de
  // gravar. A RLS bloquearia a leitura, mas a checagem é a defesa da aplicação.
  if (parsed.data.colorId) {
    const { data: color } = await supabase
      .from("colors")
      .select("id")
      .eq("id", parsed.data.colorId)
      .eq("store_id", store.id)
      .maybeSingle();

    if (!color) return { error: "Cor não encontrada." };
  }

  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    name: parsed.data.name,
    color_id: parsed.data.colorId,
    size: parsed.data.size || null,
    price: parsed.data.price || null,
    status: parsed.data.status,
  });

  if (error) return { error: "Não foi possível adicionar a variação." };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  return {};
}

export async function toggleVariantStatus(productId: string, variantId: string, currentStatus: string) {
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  const nextStatus = currentStatus === "available" ? "sold_out" : "available";
  await supabase
    .from("product_variants")
    .update({ status: nextStatus })
    .eq("id", variantId)
    .eq("product_id", productId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}

// "Remover" no painel é soft delete (status='archived'), nunca DELETE físico.
export async function archiveVariant(productId: string, variantId: string) {
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  await supabase
    .from("product_variants")
    .update({ status: "archived" })
    .eq("id", variantId)
    .eq("product_id", productId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}
