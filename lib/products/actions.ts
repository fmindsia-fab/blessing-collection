"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  measurements: z.string().optional(),
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
    measurements: formData.get("measurements"),
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
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      category_id: parsed.data.categoryId || null,
      collection_id: parsed.data.collectionId || null,
      model_id: parsed.data.modelId || null,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description || null,
      price: parsed.data.price,
      materials: parsed.data.materials || null,
      measurements: parsed.data.measurements || null,
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

  if (error || !product) return { error: "Não foi possível criar o produto. Verifique se o nome já existe." };

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
      measurements: parsed.data.measurements || null,
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
 * Move um produto na ordem de exibição do catálogo (PRD 3.7).
 *
 * A ordem vale para a loja inteira, então a troca acontece entre vizinhos na
 * mesma listagem que o painel mostra. Reescreve `sort_order` de todos para
 * manter a sequência densa — produtos criados depois nascem com 0 e ficariam
 * empatados, tornando a troca por índice imprevisível.
 */
export async function moveProduct(productId: string, direction: "up" | "down") {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, sort_order, created_at")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!products || products.length < 2) return;

  const index = products.findIndex((p) => p.id === productId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= products.length) return;

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
