"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const categorySchema = z.object({
  name: z.string().min(1, "Informe o nome da categoria"),
  description: z.string().optional(),
});

export type CategoryFormState = {
  error?: string;
};

export async function createCategory(_prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("categories").insert({
    store_id: store.id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
  });

  if (error) return { error: "Não foi possível criar a categoria. Verifique se o nome já existe." };

  revalidatePath("/admin/categorias");
  return {};
}

export async function updateCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name, description: parsed.data.description || null })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath("/admin/categorias");
  return {};
}

export async function archiveCategory(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("categories").update({ status: "archived" }).eq("id", id).eq("store_id", store.id);
  revalidatePath("/admin/categorias");
}

export async function restoreCategory(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("categories").update({ status: "active" }).eq("id", id).eq("store_id", store.id);
  revalidatePath("/admin/categorias");
}
