"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";
import { revalidateStorePaths } from "@/lib/store/revalidate-store-paths";
import { slugify } from "@/lib/utils";

const modelSchema = z.object({
  name: z.string().min(1, "Informe o nome do modelo"),
  description: z.string().optional(),
});

export type ModelFormState = {
  error?: string;
};

export async function createModel(_prevState: ModelFormState, formData: FormData): Promise<ModelFormState> {
  const parsed = modelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("models").insert({
    store_id: store.id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
  });

  if (error) return { error: "Não foi possível criar o modelo. Verifique se o nome já existe." };

  revalidatePath("/admin/modelos");
  revalidateStorePaths(store.slug);
  return {};
}

export async function updateModel(
  id: string,
  _prevState: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  const parsed = modelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("models")
    .update({ name: parsed.data.name, description: parsed.data.description || null })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath("/admin/modelos");
  revalidateStorePaths(store.slug);
  return {};
}

// "Excluir" no painel é sempre soft delete via status.
export async function archiveModel(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("models").update({ status: "archived" }).eq("id", id).eq("store_id", store.id);
  revalidatePath("/admin/modelos");
  revalidateStorePaths(store.slug);
}

export async function restoreModel(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("models").update({ status: "active" }).eq("id", id).eq("store_id", store.id);
  revalidatePath("/admin/modelos");
  revalidateStorePaths(store.slug);
}
