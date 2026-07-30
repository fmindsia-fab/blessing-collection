"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";

const storeSettingsSchema = z.object({
  whatsappNumber: z.string().min(8, "Informe um número de WhatsApp válido"),
  instagramUrl: z.string().url("Informe uma URL válida").optional().or(z.literal("")),
  description: z.string().optional(),
});

export type StoreSettingsFormState = {
  error?: string;
  success?: boolean;
};

// A loja é resolvida no servidor via STORE_SLUG — nunca a partir de um id
// enviado pelo formulário, que o client poderia forjar.
export async function updateStoreSettings(
  _prevState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  const parsed = storeSettingsSchema.safeParse({
    whatsappNumber: formData.get("whatsappNumber"),
    instagramUrl: formData.get("instagramUrl"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("stores")
    .update({
      whatsapp_number: parsed.data.whatsappNumber.replace(/\D/g, ""),
      instagram_url: parsed.data.instagramUrl || null,
      description: parsed.data.description || null,
    })
    .eq("id", store.id);

  if (error) return { error: "Não foi possível salvar as configurações." };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  return { success: true };
}
