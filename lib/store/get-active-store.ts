import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getActiveStore = cache(async () => {
  const slug = process.env.STORE_SLUG;
  if (!slug) {
    throw new Error("STORE_SLUG não definido no ambiente");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    throw new Error(`Loja ativa não encontrada para STORE_SLUG="${slug}"`);
  }

  return data;
});
