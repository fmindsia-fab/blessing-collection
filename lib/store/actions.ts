"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { FONT_VALUES, HEX_COLOR_PATTERN } from "@/lib/store/branding";

const hexColor = (label: string) =>
  z.string().regex(HEX_COLOR_PATTERN, `Informe uma cor válida em hexadecimal para ${label} (ex: #C9A227)`);

const storeSettingsSchema = z.object({
  whatsappNumber: z.string().min(8, "Informe um número de WhatsApp válido"),
  instagramUrl: z.string().url("Informe uma URL válida").optional().or(z.literal("")),
  description: z.string().optional(),
  colorPrimary: hexColor("a cor primária"),
  colorSecondary: hexColor("a cor secundária"),
  colorAccent: hexColor("a cor de destaque"),
  fontFamily: z.enum(FONT_VALUES, { message: "Selecione uma das fontes disponíveis" }),
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
    colorPrimary: formData.get("colorPrimary"),
    colorSecondary: formData.get("colorSecondary"),
    colorAccent: formData.get("colorAccent"),
    fontFamily: formData.get("fontFamily"),
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
      color_primary: parsed.data.colorPrimary,
      color_secondary: parsed.data.colorSecondary,
      color_accent: parsed.data.colorAccent,
      font_family: parsed.data.fontFamily,
    })
    .eq("id", store.id);

  if (error) return { error: "Não foi possível salvar as configurações." };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2MB, conforme PRD seção 13.1
const LOGO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]; // sem SVG
const LOGO_BUCKET = "product-images";

// Revalidação no servidor: o client valida antes de enviar, mas a checagem que
// vale é esta (PLAN.md risco 4).
export async function uploadStoreLogo(
  _prevState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione uma imagem." };

  if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
    return { error: "Formato inválido. Use JPEG, PNG ou WebP (SVG não é aceito)." };
  }
  if (file.size > LOGO_MAX_SIZE) {
    return { error: "O logo deve ter no máximo 2MB." };
  }

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
  const bucket = supabase.storage.from(LOGO_BUCKET);

  // Mesmo prefixo <store_id>/ que as policies de storage já exigem.
  const extension = file.name.split(".").pop() ?? "png";
  const path = `${store.id}/logo/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("[uploadStoreLogo]", uploadError);
    return { error: "Falha ao enviar o logo. Tente novamente." };
  }

  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(path);

  const { error } = await supabase.from("stores").update({ logo_url: publicUrl }).eq("id", store.id);
  if (error) return { error: "Logo enviado, mas houve falha ao salvar no banco." };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}
