import { cache } from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Lista explícita de colunas, não select("*"): a policy pública
// (stores_public_read_active) libera SELECT em qualquer coluna, e stores
// também guarda campos internos de precificação (monthly_pay, tax_percent,
// default_margin_percent...) que não são pra visitante nenhum ver — mesmo
// que a UI não os renderize, a resposta bruta da API os exporia.
const PUBLIC_STORE_COLUMNS =
  "id, name, slug, description, whatsapp_number, logo_url, instagram_url, color_primary, color_secondary, color_accent, brand_colors, font_family, custom_font_url, custom_font_name, status";

export const getStoreBySlug = cache(async (slug: string) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("stores")
    .select(PUBLIC_STORE_COLUMNS)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
});
