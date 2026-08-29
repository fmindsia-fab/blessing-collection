"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";
import { slugify } from "@/lib/utils";

// Mesmo formato do check da migration 0013: #rgb ou #rrggbb.
const HEX = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

const hexField = (label: string) =>
  z
    .string()
    .trim()
    .regex(HEX, `${label} deve ser um código hexadecimal, como #C3B3D6`);

const colorSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da cor"),
  hex: hexField("A cor"),
  // Vazio = cor sólida. Preenchido = amostra dividida ao meio.
  hexSecondary: z
    .union([z.literal(""), hexField("A segunda cor")])
    .optional()
    .transform((value) => (value ? value : null)),
});

export type ColorFormState = {
  error?: string;
};

function parse(formData: FormData) {
  return colorSchema.safeParse({
    name: formData.get("name"),
    hex: formData.get("hex"),
    hexSecondary: formData.get("hexSecondary") ?? "",
  });
}

function revalidate() {
  revalidatePath("/admin/cores");
  revalidatePath("/produtos");
}

export async function createColor(
  _prevState: ColorFormState,
  formData: FormData,
): Promise<ColorFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const slug = slugify(parsed.data.name);
  if (!slug) return { error: "O nome precisa ter ao menos uma letra ou número." };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("colors").insert({
    store_id: store.id,
    name: parsed.data.name,
    slug,
    hex: parsed.data.hex,
    hex_secondary: parsed.data.hexSecondary,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Já existe uma cor com esse nome."
          : "Não foi possível criar a cor.",
    };
  }

  revalidate();
  return {};
}

export async function updateColor(
  id: string,
  _prevState: ColorFormState,
  formData: FormData,
): Promise<ColorFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  // O slug não muda ao renomear: ele está nos links de filtro que a
  // proprietária pode ter compartilhado.
  const { error } = await supabase
    .from("colors")
    .update({
      name: parsed.data.name,
      hex: parsed.data.hex,
      hex_secondary: parsed.data.hexSecondary,
    })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidate();
  return {};
}

// "Excluir" no painel é sempre soft delete via status.
export async function archiveColor(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("colors").update({ status: "archived" }).eq("id", id).eq("store_id", store.id);
  revalidate();
}

export async function restoreColor(id: string) {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  await supabase.from("colors").update({ status: "active" }).eq("id", id).eq("store_id", store.id);
  revalidate();
}
