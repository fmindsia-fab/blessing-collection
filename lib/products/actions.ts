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

const productSchema = z.object({
  name: z.string().min(1, "Informe o nome do produto"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Informe um preço válido"),
  materials: z.string().optional(),
  measurements: z.string().optional(),
  status: z.enum(["available", "made_to_order", "sold_out", "inactive"]),
  categoryId: z.string().optional(),
  collectionId: z.string().optional(),
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
    status: formData.get("status"),
    categoryId: formData.get("categoryId") || undefined,
    collectionId: formData.get("collectionId") || undefined,
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
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description || null,
      price: parsed.data.price,
      materials: parsed.data.materials || null,
      measurements: parsed.data.measurements || null,
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

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId || null,
      collection_id: parsed.data.collectionId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      materials: parsed.data.materials || null,
      measurements: parsed.data.measurements || null,
      status: parsed.data.status,
      is_featured: parsed.data.isFeatured ?? false,
      is_new_arrival: parsed.data.isNewArrival ?? false,
    })
    .eq("id", productId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${productId}/editar`);
  return {};
}

// "Excluir" no painel nunca é DELETE físico — sempre soft delete via status.
export async function deactivateProduct(productId: string) {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("products")
    .update({ status: "inactive", archived_at: new Date().toISOString() })
    .eq("id", productId);
  revalidatePath("/admin/produtos");
}

export async function restoreProduct(productId: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("products").update({ status: "available", archived_at: null }).eq("id", productId);
  revalidatePath("/admin/produtos");
}
