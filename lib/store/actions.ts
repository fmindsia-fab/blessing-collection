"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";
import { parseBrandColors } from "@/lib/store/branding";
import { isCuratedFont } from "@/lib/store/fonts";

// Configurações de marca afetam o tema aplicado tanto no painel (layout do
// admin) quanto na loja pública (layout de /loja/[storeSlug]) — os dois
// precisam revalidar juntos, já que ambos leem a mesma linha de `stores`.
function revalidateBrandLayouts(storeSlug: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/loja/${storeSlug}`, "layout");
}

const storeSettingsSchema = z.object({
  whatsappNumber: z.string().min(8, "Informe um número de WhatsApp válido"),
  instagramUrl: z.string().url("Informe uma URL válida").optional().or(z.literal("")),
  description: z.string().optional(),
  // A lista curada cresce sem migration (o check do banco foi removido na
  // 0010), então a validação de valor conhecido é feita aqui.
  fontFamily: z.string().refine(isCuratedFont, "Selecione uma das fontes disponíveis"),
});

export type StoreSettingsFormState = {
  error?: string;
  success?: boolean;
};

// A loja é resolvida no servidor pelo usuário autenticado (getOwnerStore) —
// nunca a partir de um id enviado pelo formulário, que o client poderia forjar.
export async function updateStoreSettings(
  _prevState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  const parsed = storeSettingsSchema.safeParse({
    whatsappNumber: formData.get("whatsappNumber"),
    instagramUrl: formData.get("instagramUrl"),
    description: formData.get("description"),
    fontFamily: formData.get("fontFamily"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // A paleta chega serializada do BrandPaletteField; validada aqui no servidor
  // com as mesmas regras do check constraint da migration 0009.
  const palette = parseBrandColors(String(formData.get("brandColors") ?? ""));
  if ("error" in palette) return { error: palette.error };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("stores")
    .update({
      whatsapp_number: parsed.data.whatsappNumber.replace(/\D/g, ""),
      instagram_url: parsed.data.instagramUrl || null,
      description: parsed.data.description || null,
      brand_colors: palette.colors,
      // Mantém as 3 colunas antigas em sincronia — leitura de fallback.
      color_primary: palette.colors[0],
      color_secondary: palette.colors[1] ?? palette.colors[0],
      color_accent: palette.colors[2] ?? palette.colors[0],
      font_family: parsed.data.fontFamily,
    })
    .eq("id", store.id);

  if (error) return { error: "Não foi possível salvar as configurações." };

  revalidatePath("/admin/configuracoes");
  revalidateBrandLayouts(store.slug);
  return { success: true };
}

const FONT_MAX_SIZE = 2 * 1024 * 1024; // 2MB: .woff2 típico tem 20-200KB
const FONT_BUCKET = "brand-fonts";

// Só .woff2: formato único com suporte universal em navegadores modernos e o
// mais leve. Aceitar .ttf/.otf convidaria arquivos de 5MB+ bloqueando a página.
export async function uploadBrandFont(
  _prevState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  const file = formData.get("font");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione um arquivo de fonte." };

  const isWoff2 =
    file.name.toLowerCase().endsWith(".woff2") &&
    ["font/woff2", "application/octet-stream", ""].includes(file.type);

  if (!isWoff2) {
    return { error: "Envie um arquivo .woff2. Outros formatos não são aceitos." };
  }
  if (file.size > FONT_MAX_SIZE) {
    return { error: "A fonte deve ter no máximo 2MB." };
  }

  const displayName = String(formData.get("fontName") ?? "").trim();
  if (!displayName) return { error: "Dê um nome para identificar a fonte." };

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  const bucket = supabase.storage.from(FONT_BUCKET);

  const path = `${store.id}/${crypto.randomUUID()}.woff2`;
  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: "font/woff2",
    upsert: false,
  });

  if (uploadError) {
    console.error("[uploadBrandFont]", uploadError);
    return { error: "Falha ao enviar a fonte. Tente novamente." };
  }

  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(path);

  const { error } = await supabase
    .from("stores")
    .update({ custom_font_url: publicUrl, custom_font_name: displayName })
    .eq("id", store.id);

  if (error) return { error: "Fonte enviada, mas houve falha ao salvar no banco." };

  revalidatePath("/admin/configuracoes");
  revalidateBrandLayouts(store.slug);
  return { success: true };
}

// Volta para a lista curada sem apagar o arquivo do Storage.
export async function removeBrandFont(): Promise<StoreSettingsFormState> {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("stores")
    .update({ custom_font_url: null, custom_font_name: null })
    .eq("id", store.id);

  if (error) return { error: "Não foi possível remover a fonte." };

  revalidatePath("/admin/configuracoes");
  revalidateBrandLayouts(store.slug);
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

  const store = await getOwnerStore();
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
  revalidateBrandLayouts(store.slug);
  return { success: true };
}
