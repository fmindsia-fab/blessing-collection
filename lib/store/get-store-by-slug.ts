import { cache } from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getStoreBySlug = cache(async (slug: string) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
});
