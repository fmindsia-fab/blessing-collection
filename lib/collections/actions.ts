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

const collectionSchema = z.object({
  name: z.string().min(1, "Informe o nome da coleção"),
  description: z.string().optional(),
});

export type CollectionFormState = {
  error?: string;
};

export async function createCollection(
  _prevState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const parsed = collectionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("collections").insert({
    store_id: store.id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
  });

  if (error) return { error: "Não foi possível criar a coleção. Verifique se o nome já existe." };

  revalidatePath("/admin/colecoes");
  return {};
}

export async function updateCollection(
  id: string,
  _prevState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const parsed = collectionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("collections")
    .update({ name: parsed.data.name, description: parsed.data.description || null })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath("/admin/colecoes");
  return {};
}

export async function archiveCollection(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("collections").update({ status: "archived" }).eq("id", id).eq("store_id", store.id);
  revalidatePath("/admin/colecoes");
}

export async function restoreCollection(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("collections").update({ status: "active" }).eq("id", id).eq("store_id", store.id);
  revalidatePath("/admin/colecoes");
}
