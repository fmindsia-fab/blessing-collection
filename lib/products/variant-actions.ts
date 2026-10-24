"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getNotOwnerError } from "@/lib/store/ownership";

const variantSchema = z.object({
  name: z.string().min(1, "Informe o nome da variação"),
  // Cor vem do cadastro (migration 0013). O campo de texto livre criava
  // "Rose"/"Rosé" como cores distintas no filtro público.
  colorId: z
    .union([z.literal(""), z.uuid("Cor inválida")])
    .optional()
    .transform((value) => value || null),
  // Eixo de escolha: variações do mesmo grupo são alternativas entre si, e a
  // cliente escolhe uma de cada grupo (migration 0016).
  variantGroup: z.string().trim().max(30).optional(),
  size: z.string().optional(),
  price: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  // Escolha obrigatória: a cliente precisa escolher uma das obrigatórias do grupo (migration 0047).
  // Desmarcado = complemento, opcional.
  isRequired: z.boolean().default(false),
  // A cliente pode escolher mais de uma opção deste grupo (migration 0048). Vale para o grupo todo.
  allowMultiple: z.boolean().default(false),
  // Material do estoque que esta variação usa (ex.: a alça) e quanto; a baixa de estoque desconta isso
  // quando a variação é escolhida num pedido (migration 0049).
  materialId: z
    .union([z.literal(""), z.uuid("Material inválido")])
    .optional()
    .transform((value) => value || null),
  materialQuantity: z.coerce.number().positive("A quantidade do material precisa ser maior que zero").max(1_000_000).default(1),
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

// O id da cor vem do formulário: confirma que é da loja ativa antes de gravar.
// A RLS bloquearia a leitura, mas a checagem explícita é a defesa da aplicação
// (regra do CLAUDE.md).
async function colorBelongsToStore(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  storeId: string,
  colorId: string | null,
) {
  if (!colorId) return true;

  const { data } = await supabase
    .from("colors")
    .select("id")
    .eq("id", colorId)
    .eq("store_id", storeId)
    .maybeSingle();

  return data !== null;
}

async function materialBelongsToStore(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  storeId: string,
  materialId: string | null,
) {
  if (!materialId) return true;

  const { data } = await supabase
    .from("materials")
    .select("id")
    .eq("id", materialId)
    .eq("store_id", storeId)
    .maybeSingle();

  return data !== null;
}

// "Pode escolher mais de uma opção" vale para o GRUPO inteiro da peça (todas as alças, por exemplo):
// ao salvar uma variação, a escolha é copiada para as outras do mesmo grupo, para nunca ficarem
// desencontradas (uma alça aceitando duas escolhas e outra não).
async function syncGroupMultiple(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  productId: string,
  group: string | null,
  value: boolean,
) {
  let query = supabase
    .from("product_variants")
    .update({ allow_multiple: value })
    .eq("product_id", productId)
    .neq("status", "archived");
  query = group ? query.eq("variant_group", group) : query.is("variant_group", null);
  const { error } = await query;
  if (error) console.error("[variantes] sincronizar 'pode escolher mais de uma'", error.message);
}

export async function createVariant(
  productId: string,
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const parsed = variantSchema.safeParse({
    name: formData.get("name"),
    colorId: formData.get("colorId") ?? "",
    variantGroup: formData.get("variantGroup") ?? "",
    // `formData.get` devolve null para campo ausente, e null não satisfaz
    // `z.string().optional()`.
    size: formData.get("size") ?? "",
    price: formData.get("price") || undefined,
    isRequired: formData.get("isRequired") === "on",
    allowMultiple: formData.get("allowMultiple") === "on",
    materialId: formData.get("materialId") ?? "",
    materialQuantity: formData.get("materialQuantity") || 1,
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  if (!(await colorBelongsToStore(supabase, store.id, parsed.data.colorId))) {
    return { error: "Cor não encontrada." };
  }

  if (!(await materialBelongsToStore(supabase, store.id, parsed.data.materialId))) {
    return { error: "Material não encontrado." };
  }

  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    name: parsed.data.name,
    color_id: parsed.data.colorId,
    variant_group: parsed.data.variantGroup || null,
    size: parsed.data.size || null,
    price: parsed.data.price || null,
    is_required: parsed.data.isRequired,
    allow_multiple: parsed.data.allowMultiple,
    material_id: parsed.data.materialId,
    material_quantity: parsed.data.materialQuantity,
    status: parsed.data.status,
  });

  if (error) return { error: "Não foi possível adicionar a variação." };

  await syncGroupMultiple(supabase, productId, parsed.data.variantGroup || null, parsed.data.allowMultiple);

  revalidatePath(`/admin/produtos/${productId}/editar`);
  return {};
}

/**
 * Edita uma variação existente.
 *
 * Sem isto, mudar o preço ou o grupo exigia remover e recadastrar — e a
 * remoção é arquivamento, então a variação antiga ficaria pendurada.
 *
 * O status não entra: já é alternado pelo botão "Marcar esgotado", e trazê-lo
 * para cá criaria dois caminhos para a mesma mudança.
 */
export async function updateVariant(
  productId: string,
  variantId: string,
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const parsed = variantSchema.omit({ status: true }).safeParse({
    name: formData.get("name"),
    colorId: formData.get("colorId") ?? "",
    variantGroup: formData.get("variantGroup") ?? "",
    // `formData.get` devolve null para campo ausente, e null não satisfaz
    // `z.string().optional()`.
    size: formData.get("size") ?? "",
    price: formData.get("price") || undefined,
    isRequired: formData.get("isRequired") === "on",
    allowMultiple: formData.get("allowMultiple") === "on",
    materialId: formData.get("materialId") ?? "",
    materialQuantity: formData.get("materialQuantity") || 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  if (!(await colorBelongsToStore(supabase, store.id, parsed.data.colorId))) {
    return { error: "Cor não encontrada." };
  }

  if (!(await materialBelongsToStore(supabase, store.id, parsed.data.materialId))) {
    return { error: "Material não encontrado." };
  }

  const { error } = await supabase
    .from("product_variants")
    .update({
      name: parsed.data.name,
      color_id: parsed.data.colorId,
      variant_group: parsed.data.variantGroup || null,
      size: parsed.data.size || null,
      price: parsed.data.price || null,
      is_required: parsed.data.isRequired,
      allow_multiple: parsed.data.allowMultiple,
      material_id: parsed.data.materialId,
      material_quantity: parsed.data.materialQuantity,
    })
    .eq("id", variantId)
    // Ancora no produto já validado: sem isto, um id de variação de outra loja
    // passaria pela checagem de posse do produto.
    .eq("product_id", productId);

  if (error) return { error: "Não foi possível salvar a variação." };

  await syncGroupMultiple(supabase, productId, parsed.data.variantGroup || null, parsed.data.allowMultiple);

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath("/produtos");
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
