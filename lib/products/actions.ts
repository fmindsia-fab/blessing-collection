"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { slugify } from "@/lib/utils";
import { getNotOwnerError } from "@/lib/store/ownership";
import { nextCopyIdentity } from "@/lib/products/duplicate";

// slugify vem de lib/utils: o componente ProductSlug usa a mesma função para
// prever a URL no client, e duas implementações divergiriam com o tempo.

// Campo numérico opcional: string vazia vira null (não informado), e valor
// preenchido precisa ser positivo — espelha o check da migration 0012.
const optionalPositiveNumber = (label: string) =>
  z
    .union([z.literal(""), z.coerce.number().positive(`Informe um valor válido para ${label}`)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value));

const productSchema = z.object({
  name: z.string().min(1, "Informe o nome do produto"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Informe um preço válido"),
  materials: z.string().optional(),
  weightKg: optionalPositiveNumber("o peso"),
  lengthCm: optionalPositiveNumber("o comprimento"),
  widthCm: optionalPositiveNumber("a largura"),
  heightCm: optionalPositiveNumber("a altura"),
  status: z.enum(["available", "made_to_order", "sold_out", "inactive"]),
  categoryId: z.string().optional(),
  collectionId: z.string().optional(),
  modelId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
});

export type ProductFormState = {
  error?: string;
};

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    materials: formData.get("materials"),
    weightKg: formData.get("weightKg") ?? "",
    lengthCm: formData.get("lengthCm") ?? "",
    widthCm: formData.get("widthCm") ?? "",
    heightCm: formData.get("heightCm") ?? "",
    status: formData.get("status"),
    categoryId: formData.get("categoryId") || undefined,
    collectionId: formData.get("collectionId") || undefined,
    modelId: formData.get("modelId") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
    isNewArrival: formData.get("isNewArrival") === "on",
  });
}

export async function createProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const baseSlug = slugify(parsed.data.name);

  // Nome repetido só importa dentro da MESMA loja: a URL do produto é
  // unique(store_id, slug). Outra conta ter um produto com o mesmo nome não
  // é conflito — cada loja vive no próprio endereço.
  const { data: sameStore } = await supabase
    .from("products")
    .select("id, archived_at")
    .eq("store_id", store.id)
    .eq("slug", baseSlug)
    .maybeSingle();

  if (sameStore) {
    return {
      error: sameStore.archived_at
        ? "Você já tem um produto arquivado com esse nome. Restaure-o ou escolha outro nome."
        : "Você já tem um produto com esse nome. Escolha um nome diferente.",
    };
  }

  const insertProduct = (slug: string) =>
    supabase
      .from("products")
      .insert({
        store_id: store.id,
        category_id: parsed.data.categoryId || null,
        collection_id: parsed.data.collectionId || null,
        model_id: parsed.data.modelId || null,
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        price: parsed.data.price,
        materials: parsed.data.materials || null,
        weight_kg: parsed.data.weightKg,
        length_cm: parsed.data.lengthCm,
        width_cm: parsed.data.widthCm,
        height_cm: parsed.data.heightCm,
        status: parsed.data.status,
        is_featured: parsed.data.isFeatured ?? false,
        is_new_arrival: parsed.data.isNewArrival ?? false,
      })
      .select("id")
      .single();

  let { data: product, error } = await insertProduct(baseSlug);

  // 23505 aqui, já descartada a duplicata na própria loja, só pode ser uma
  // colisão de slug fora dela (índice mais amplo que (store_id, slug)) ou uma
  // corrida entre dois envios. Tenta de novo com sufixo em vez de barrar.
  if (error?.code === "23505") {
    const suffix = Math.random().toString(36).slice(2, 6);
    ({ data: product, error } = await insertProduct(`${baseSlug}-${suffix}`));
  }

  if (error || !product) {
    console.error("[createProduct]", error?.code, error?.message, error?.details);
    return { error: "Não foi possível criar o produto. Tente novamente." };
  }

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${product.id}/editar`);
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId || null,
      collection_id: parsed.data.collectionId || null,
      model_id: parsed.data.modelId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      materials: parsed.data.materials || null,
      weight_kg: parsed.data.weightKg,
      length_cm: parsed.data.lengthCm,
      width_cm: parsed.data.widthCm,
      height_cm: parsed.data.heightCm,
      status: parsed.data.status,
      is_featured: parsed.data.isFeatured ?? false,
      is_new_arrival: parsed.data.isNewArrival ?? false,
    })
    .eq("id", productId)
    .eq("store_id", store.id);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${productId}/editar`);
  redirect("/admin/produtos");
}

/**
 * Regenera o slug (URL) a partir do nome atual.
 *
 * A URL não muda sozinha ao renomear o produto: links já enviados a clientes
 * por WhatsApp continuariam funcionando, e o Google não perderia a página.
 * Esta ação é explícita — a proprietária decide quando vale trocar.
 */
export async function refreshProductSlug(productId: string): Promise<ProductFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, slug")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();

  if (!product) return { error: "Produto não encontrado." };

  const nextSlug = slugify(product.name);
  if (!nextSlug) return { error: "O nome do produto não gera uma URL válida." };
  if (nextSlug === product.slug) return {};

  const { error } = await supabase
    .from("products")
    .update({ slug: nextSlug })
    .eq("id", productId)
    .eq("store_id", store.id);

  // unique(store_id, slug): outra peça já usa essa URL.
  if (error) return { error: "Já existe uma peça com essa URL. Ajuste o nome e tente de novo." };

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath("/produtos");
  return {};
}

/**
 * Move um produto na ordem de exibição do catálogo (PRD 3.7).
 *
 * A ordem vale para a loja inteira, mas a troca acontece entre vizinhos da
 * mesma categoria — é assim que o painel agrupa a listagem. Reescreve
 * `sort_order` de todos para manter a sequência densa: produtos criados depois
 * nascem com 0 e ficariam empatados, tornando a troca por índice imprevisível.
 */
export async function moveProduct(productId: string, direction: "up" | "down") {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, sort_order, created_at, category_id")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!products || products.length < 2) return;

  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) return;

  // O painel agrupa a listagem por categoria, então a seta troca com o vizinho
  // do mesmo grupo — não com o vizinho na lista global. Sem isso, subir a
  // primeira peça de "Acessórios" a mandaria para dentro de "Bolsas", e a
  // seta faria algo diferente do que a tela mostra.
  const categoryId = products[index].category_id;
  const sameCategory = products.filter((p) => p.category_id === categoryId);

  const indexInGroup = sameCategory.findIndex((p) => p.id === productId);
  const targetInGroup = direction === "up" ? indexInGroup - 1 : indexInGroup + 1;
  if (targetInGroup < 0 || targetInGroup >= sameCategory.length) return;

  const target = products.findIndex((p) => p.id === sameCategory[targetInGroup].id);

  const reordered = [...products];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  await Promise.all(
    reordered.map((product, position) =>
      supabase
        .from("products")
        .update({ sort_order: position })
        .eq("id", product.id)
        .eq("store_id", store.id),
    ),
  );

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath("/");
}

/**
 * Grava a nova ordem de um grupo inteiro após arrastar e soltar.
 *
 * Recebe os ids na ordem final em vez de uma troca par a par: arrastar move um
 * item várias posições de uma vez, e reproduzir isso com trocas sucessivas
 * geraria uma escrita por passo.
 *
 * As peças só trocam de posição entre si — as demais categorias mantêm as
 * posições que já tinham, porque o painel arrasta dentro de um grupo só.
 */
export async function reorderProducts(orderedIds: string[]) {
  if (orderedIds.length < 2) return;

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, sort_order, created_at")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!products) return;

  // Os ids chegam do client: descarta qualquer um que não seja da loja ativa
  // antes de escrever. A RLS bloquearia a gravação, mas a checagem explícita é
  // a defesa da aplicação (regra do CLAUDE.md).
  const known = new Set(products.map((p) => p.id));
  const moving = orderedIds.filter((id) => known.has(id));
  if (moving.length < 2) return;

  // As posições que o grupo ocupa hoje na lista global; o conteúdo delas é
  // substituído pela nova ordem, sem deslocar as outras categorias.
  const slots = products
    .map((product, index) => (moving.includes(product.id) ? index : -1))
    .filter((index) => index !== -1);

  const reordered = [...products];
  slots.forEach((slot, i) => {
    reordered[slot] = products.find((p) => p.id === moving[i])!;
  });

  await Promise.all(
    reordered.map((product, position) =>
      supabase
        .from("products")
        .update({ sort_order: position })
        .eq("id", product.id)
        .eq("store_id", store.id),
    ),
  );

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath("/");
}

// "Excluir" no painel nunca é DELETE físico — sempre soft delete via status.
export async function deactivateProduct(productId: string) {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("products")
    .update({ status: "inactive", archived_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("store_id", store.id);
  revalidatePath("/admin/produtos");
}

export async function restoreProduct(productId: string) {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("products")
    .update({ status: "available", archived_at: null })
    .eq("id", productId)
    .eq("store_id", store.id);
  revalidatePath("/admin/produtos");
}

/**
 * Duplica uma peça parecida com uma que já existe: copia os dados, as variações e os
 * materiais da formação de preço, e abre a cópia para edição.
 *
 * A cópia nasce INATIVA (fora do catálogo até a pessoa conferir) e SEM fotos nem vídeo:
 * as fotos pertencem a cada peça (excluir uma não pode apagar a foto da outra) e peças
 * parecidas quase nunca têm as mesmas fotos. Destaque e lançamento também não são copiados.
 */
export async function duplicateProduct(productId: string): Promise<ProductFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { data: original } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();

  if (!original) return { error: "Peça não encontrada." };

  // Endereços já usados na loja (inclusive de peças arquivadas): o slug é único por loja.
  const { data: slugRows } = await supabase.from("products").select("slug").eq("store_id", store.id);
  const identity = nextCopyIdentity(original.name, (slugRows ?? []).map((row) => row.slug));

  const { data: copy, error } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      category_id: original.category_id,
      collection_id: original.collection_id,
      model_id: original.model_id,
      name: identity.name,
      slug: identity.slug,
      description: original.description,
      price: original.price,
      materials: original.materials,
      weight_kg: original.weight_kg,
      length_cm: original.length_cm,
      width_cm: original.width_cm,
      height_cm: original.height_cm,
      production_hours: original.production_hours,
      other_costs: original.other_costs,
      pricing_method: original.pricing_method,
      pricing_rate_percent: original.pricing_rate_percent,
      status: "inactive",
      is_featured: false,
      is_new_arrival: false,
    })
    .select("id")
    .single();

  if (error || !copy) {
    console.error("[duplicateProduct]", error?.code, error?.message);
    return { error: "Não foi possível duplicar a peça. Tente novamente." };
  }

  const [{ data: variants }, { data: pricingMaterials }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("name, color, color_id, variant_group, size, price, status, sort_order")
      .eq("product_id", original.id)
      .neq("status", "archived"),
    supabase
      .from("product_materials")
      .select("material_id, description, quantity, unit, unit_cost, sort_order")
      .eq("product_id", original.id),
  ]);

  // Se uma das cópias falhar, a peça já existe (inativa) e a pessoa confere na edição;
  // não apagamos nada (regra do projeto: sem exclusão definitiva).
  if (variants && variants.length > 0) {
    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(variants.map((variant) => ({ ...variant, product_id: copy.id })));
    if (variantsError) console.error("[duplicateProduct] variações", variantsError.code, variantsError.message);
  }
  if (pricingMaterials && pricingMaterials.length > 0) {
    const { error: materialsError } = await supabase
      .from("product_materials")
      .insert(pricingMaterials.map((row) => ({ ...row, product_id: copy.id })));
    if (materialsError) console.error("[duplicateProduct] materiais", materialsError.code, materialsError.message);
  }

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${copy.id}/editar?copia=1`);
}
