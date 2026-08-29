import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SitemapEntry = {
  path: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

const PUBLIC_STATUSES = ["available", "made_to_order", "sold_out"] as const;

/**
 * Rotas públicas indexáveis da loja.
 *
 * Separado de `app/sitemap.ts` para ser testável sem o runtime do Next.
 * Produtos `inactive` e categorias/coleções arquivadas ficam de fora — a RLS
 * já os esconde do anon, mas o filtro explícito documenta a intenção e evita
 * depender só dela.
 */
export async function getSitemapEntries(storeId: string): Promise<SitemapEntry[]> {
  const supabase = await createServerSupabaseClient();

  const [{ data: products }, { data: categories }, { data: collections }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("store_id", storeId)
      .in("status", PUBLIC_STATUSES),
    supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("store_id", storeId)
      .eq("status", "active"),
    supabase
      .from("collections")
      .select("slug, updated_at")
      .eq("store_id", storeId)
      .eq("status", "active"),
  ]);

  const now = new Date();

  // A home é a página mais importante; o catálogo muda com mais frequência
  // que as páginas individuais de produto.
  const entries: SitemapEntry[] = [
    { path: "/", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { path: "/produtos", lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  for (const product of products ?? []) {
    entries.push({
      path: `/produtos/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const category of categories ?? []) {
    entries.push({
      path: `/categorias/${category.slug}`,
      lastModified: new Date(category.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const collection of collections ?? []) {
    entries.push({
      path: `/colecoes/${collection.slug}`,
      lastModified: new Date(collection.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}

// Junta base e caminho sem gerar barra dupla.
export function absoluteUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path === "/" ? "" : path}` || baseUrl;
}
