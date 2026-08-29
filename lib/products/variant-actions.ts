"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";
import { revalidateStorePaths } from "@/lib/store/revalidate-store-paths";

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
  const store = await getOwnerStore();
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
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  if (!(await colorBelongsToStore(supabase, store.id, parsed.data.colorId))) {
    return { error: "Cor não encontrada." };
  }

  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    name: parsed.data.name,
    color_id: parsed.data.colorId,
    variant_group: parsed.data.variantGroup || null,
    size: parsed.data.size || null,
    price: parsed.data.price || null,
    status: parsed.data.status,
  });

  if (error) return { error: "Não foi possível adicionar a variação." };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  return {};
}

const sizeVariantsSchema = z.object({
  group: z.string().trim().min(1).max(30),
  // Chegam do multi-select de chips (lib/products/size-presets.ts) — a lista
  // em si já é fechada no client, então aqui só garante 1+ valor não vazio.
  sizes: z.array(z.string().trim().min(1)).min(1, "Selecione ao menos um tamanho"),
  colorId: z
    .union([z.literal(""), z.uuid("Cor inválida")])
    .optional()
    .transform((value) => value || null),
  price: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
});

/**
 * Cria uma variante por tamanho selecionado, de uma vez — o par (multi-select
 * de chips) para createVariant, usado quando a loja tem preset de tamanho
 * (business_type clothing/footwear). Mesma tabela, mesmas regras; só evita
 * repetir "Adicionar variação" um tamanho por vez.
 */
export async function createSizeVariants(
  productId: string,
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const parsed = sizeVariantsSchema.safeParse({
    group: formData.get("group"),
    sizes: formData.getAll("sizes"),
    colorId: formData.get("colorId") ?? "",
    price: formData.get("price") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  if (!(await colorBelongsToStore(supabase, store.id, parsed.data.colorId))) {
    return { error: "Cor não encontrada." };
  }

  const { error } = await supabase.from("product_variants").insert(
    parsed.data.sizes.map((size) => ({
      product_id: productId,
      name: size,
      color_id: parsed.data.colorId,
      variant_group: parsed.data.group,
      size,
      price: parsed.data.price || null,
      status: "available" as const,
    })),
  );

  if (error) return { error: "Não foi possível adicionar os tamanhos." };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidateStorePaths(store.slug);
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
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  if (!(await colorBelongsToStore(supabase, store.id, parsed.data.colorId))) {
    return { error: "Cor não encontrada." };
  }

  const { error } = await supabase
    .from("product_variants")
    .update({
      name: parsed.data.name,
      color_id: parsed.data.colorId,
      variant_group: parsed.data.variantGroup || null,
      size: parsed.data.size || null,
      price: parsed.data.price || null,
    })
    .eq("id", variantId)
    // Ancora no produto já validado: sem isto, um id de variação de outra loja
    // passaria pela checagem de posse do produto.
    .eq("product_id", productId);

  if (error) return { error: "Não foi possível salvar a variação." };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidateStorePaths(store.slug);
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
