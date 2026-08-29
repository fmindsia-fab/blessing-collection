import type { MetadataRoute } from "next";
import { getActiveStore } from "@/lib/store/get-active-store";
import { absoluteUrl, getSitemapEntries } from "@/lib/seo/sitemap-entries";

// Lê o banco a cada requisição: um produto novo entra no sitemap sem redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Sem a URL pública não há como montar `loc` absoluto — melhor devolver
  // sitemap vazio que URLs relativas, que os buscadores rejeitam.
  if (!siteUrl) return [];

  const store = await getActiveStore();
  const entries = await getSitemapEntries(store.id);

  return entries.map((entry) => ({
    url: absoluteUrl(siteUrl, entry.path),
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
