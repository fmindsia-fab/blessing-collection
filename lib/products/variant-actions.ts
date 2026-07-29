"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const variantSchema = z.object({
  name: z.string().min(1, "Informe o nome da variação"),
  color: z.string().optional(),
  size: z.string().optional(),
  price: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  status: z.enum(["available", "sold_out"]),
});

export type VariantFormState = {
  error?: string;
};

export async function createVariant(
  productId: string,
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const parsed = variantSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    size: formData.get("size"),
    price: formData.get("price") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    name: parsed.data.name,
    color: parsed.data.color || null,
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
  const nextStatus = currentStatus === "available" ? "sold_out" : "available";
  await supabase.from("product_variants").update({ status: nextStatus }).eq("id", variantId);
  revalidatePath(`/admin/produtos/${productId}/editar`);
}

export async function deleteVariant(productId: string, variantId: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("product_variants").delete().eq("id", variantId);
  revalidatePath(`/admin/produtos/${productId}/editar`);
}
