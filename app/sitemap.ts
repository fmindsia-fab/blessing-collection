import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { absoluteUrl, getSitemapEntries } from "@/lib/seo/sitemap-entries";

// Lê o banco a cada requisição: um produto novo entra no sitemap sem redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Sem a URL pública não há como montar `loc` absoluto — melhor devolver
  // sitemap vazio que URLs relativas, que os buscadores rejeitam.
  if (!siteUrl) return [];

  const supabase = await createServerSupabaseClient();
  const { data: stores } = await supabase.from("stores").select("id, slug").eq("status", "active");

  const entriesByStore = await Promise.all(
    (stores ?? []).map((store) => getSitemapEntries(store.id, store.slug)),
  );

  return entriesByStore.flat().map((entry) => ({
    url: absoluteUrl(siteUrl, entry.path),
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
