import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CatalogSort } from "@/lib/catalog/sort";
import { accentInsensitivePattern, searchTokens } from "@/lib/catalog/search";

const PUBLIC_STATUSES = ["available", "made_to_order", "sold_out"] as const;
export const PAGE_SIZE = 12;

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: (typeof PUBLIC_STATUSES)[number] | "inactive";
  cover_image_url: string | null;
  min_variant_price: number | null;
  /** Dados do cartão da lista: cores disponíveis, "a partir de" e se tem variações. */
  swatches?: { hex: string; hexSecondary: string | null; name: string }[];
  from_price?: boolean;
  has_variants?: boolean;
};

async function withCoverImages(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  products: { id: string; price: number }[],
) {
  if (products.length === 0) return new Map<string, string>();

  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, url")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .eq("is_cover", true);

  return new Map((images ?? []).map((img) => [img.product_id, img.url]));
}

type CardExtras = {
  swatches: { hex: string; hexSecondary: string | null; name: string }[];
  from_price: boolean;
  has_variants: boolean;
};

const NO_EXTRAS: CardExtras = { swatches: [], from_price: false, has_variants: false };

/**
 * O que o cartão da peça mostra além da foto: as cores disponíveis (variações com cor
 * cadastrada e não esgotadas), se alguma variação custa mais que o preço base ("a partir de")
 * e se a peça tem variações (nesse caso o atalho da sacola não aparece, a escolha é na peça).
 * Duas consultas para a lista inteira, sem uma por peça.
 */
async function getCardExtras(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  storeId: string,
  products: { id: string; price: number }[],
) {
  const extras = new Map<string, CardExtras>();
  if (products.length === 0) return extras;

  const { data: variants } = await supabase
    .from("product_variants")
    .select("product_id, color_id, price, status")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .neq("status", "archived");

  if (!variants || variants.length === 0) return extras;

  const colorIds = [...new Set(variants.map((v) => v.color_id).filter((id): id is string => Boolean(id)))];
  const colorById = new Map<string, { hex: string; hex_secondary: string | null; name: string }>();
  if (colorIds.length > 0) {
    const { data: colors } = await supabase
      .from("colors")
      .select("id, name, hex, hex_secondary")
      .eq("store_id", storeId)
      .in("id", colorIds);
    for (const color of colors ?? []) colorById.set(color.id, color);
  }

  const priceByProduct = new Map(products.map((p) => [p.id, p.price]));

  for (const variant of variants) {
    const current = extras.get(variant.product_id) ?? { swatches: [], from_price: false, has_variants: true };
    const basePrice = priceByProduct.get(variant.product_id) ?? 0;

    if (variant.price != null && variant.price > basePrice) current.from_price = true;

    const color = variant.color_id && variant.status === "available" ? colorById.get(variant.color_id) : undefined;
    if (color && !current.swatches.some((s) => s.hex === color.hex && s.hexSecondary === color.hex_secondary)) {
      current.swatches.push({ hex: color.hex, hexSecondary: color.hex_secondary, name: color.name });
    }
    extras.set(variant.product_id, current);
  }

  return extras;
}

/** Foto de capa + dados do cartão, juntos, para todas as listas do catálogo. */
async function withCardData<T extends { id: string; price: number }>(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  storeId: string,
  products: T[],
) {
  const [covers, extras] = await Promise.all([
    withCoverImages(supabase, products),
    getCardExtras(supabase, storeId, products),
  ]);

  return products.map((p) => ({
    ...p,
    cover_image_url: covers.get(p.id) ?? null,
    ...(extras.get(p.id) ?? NO_EXTRAS),
  }));
}

export type ColorFilterOption = {
  id: string;
  name: string;
  slug: string;
  hex: string;
  hexSecondary: string | null;
  count: number;
};

/**
 * Cores em uso no catálogo, com quantas peças cada uma tem (PRD 3.2).
 *
 * Conta produtos distintos, não variantes: uma peça com duas variantes da
 * mesma cor apareceria como "2" e não bateria com o resultado do filtro.
 *
 * Só retorna cores que têm peça pública — mesma razão de `listModelsInUse`:
 * uma opção sem resultado é um beco sem saída para a cliente.
 */
export async function listColorsInUse(storeId: string): Promise<ColorFilterOption[]> {
  const supabase = await createServerSupabaseClient();

  const [{ data: colors }, { data: variants }] = await Promise.all([
    supabase
      .from("colors")
      .select("id, name, slug, hex, hex_secondary")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("color_id, product_id, products!inner(store_id, status)")
      .eq("products.store_id", storeId)
      .in("products.status", PUBLIC_STATUSES)
      .neq("status", "archived")
      .not("color_id", "is", null),
  ]);

  const productsByColor = new Map<string, Set<string>>();
  for (const row of (variants ?? []) as { color_id: string | null; product_id: string }[]) {
    if (!row.color_id) continue;
    const products = productsByColor.get(row.color_id) ?? new Set<string>();
    products.add(row.product_id);
    productsByColor.set(row.color_id, products);
  }

  return (colors ?? [])
    .filter((color) => productsByColor.has(color.id))
    .map((color) => ({
      id: color.id,
      name: color.name,
      slug: color.slug,
      hex: color.hex,
      hexSecondary: color.hex_secondary,
      count: productsByColor.get(color.id)!.size,
    }));
}

export async function listProducts({
  storeId,
  page = 1,
  categoryId,
  collectionId,
  modelId,
  search,
  colorId,
  availability,
  sort,
}: {
  storeId: string;
  page?: number;
  categoryId?: string;
  collectionId?: string;
  modelId?: string;
  search?: string;
  colorId?: string;
  availability?: string;
  /** Sem valor: a ordem definida pela dona no painel. */
  sort?: CatalogSort;
}) {
  const supabase = await createServerSupabaseClient();
  // "Carregar mais" acumula: a página 2 traz as 24 primeiras peças, não as 12
  // da segunda fatia. Buscar só a fatia trocaria a lista em vez de estendê-la,
  // e a cliente perderia de vista o que já tinha rolado.
  const from = 0;
  const to = page * PAGE_SIZE - 1;

  const buildQuery = async (searchMode: "full" | "simple") => {
    // Filtro por cor precisa de join com as variantes; sem ele, evitamos o join
    // para não pagar o custo em toda listagem.
    const selectClause = colorId
      ? "id, name, slug, price, status, product_variants!inner(color_id, status)"
      : "id, name, slug, price, status";

    let query = supabase
      .from("products")
      .select(selectClause, { count: "exact" })
      .eq("store_id", storeId);

    // Ordem pedida pela cliente; sem pedido, a ordem da loja (sort_order) com as mais novas primeiro.
    // Desempate por data para a paginação nunca repetir nem pular peças de mesmo preço.
    if (sort === "menor-preco") {
      query = query.order("price", { ascending: true }).order("created_at", { ascending: false });
    } else if (sort === "maior-preco") {
      query = query.order("price", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "novidades") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    }
    query = query.range(from, to);

    // Disponibilidade é um subconjunto dos status públicos — nunca amplia o que
    // o visitante enxerga.
    const isPublicStatus = (value: string): value is (typeof PUBLIC_STATUSES)[number] =>
      (PUBLIC_STATUSES as readonly string[]).includes(value);

    const statusFilter: readonly (typeof PUBLIC_STATUSES)[number][] =
      availability && isPublicStatus(availability) ? [availability] : PUBLIC_STATUSES;

    query = query.in("status", statusFilter);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (collectionId) query = query.eq("collection_id", collectionId);
    if (modelId) query = query.eq("model_id", modelId);
    // Busca: cada palavra precisa aparecer no nome, na descrição, nos materiais ou no nome da
    // categoria/coleção/modelo da peça, com ou sem acento (ver lib/catalog/search.ts).
    const tokens = searchTokens(search);
    if (searchMode === "simple" && search) {
      // Reserva: busca só pelo nome (usada se a busca completa falhar).
      query = query.ilike("name", `%${search.replace(/[^\p{L}\p{N}\s]/gu, " ").trim()}%`);
    } else if (tokens.length > 0) {
      const groupIds = await Promise.all(
        tokens.map(async (token) => {
          const pattern = accentInsensitivePattern(token);
          const [categories, collections, models] = await Promise.all([
            supabase.from("categories").select("id").eq("store_id", storeId).filter("name", "imatch", pattern),
            supabase.from("collections").select("id").eq("store_id", storeId).filter("name", "imatch", pattern),
            supabase.from("models").select("id").eq("store_id", storeId).filter("name", "imatch", pattern),
          ]);
          return {
            pattern,
            categories: (categories.data ?? []).map((row) => row.id),
            collections: (collections.data ?? []).map((row) => row.id),
            models: (models.data ?? []).map((row) => row.id),
          };
        }),
      );

      for (const entry of groupIds) {
        const conditions = [
          `name.imatch.${entry.pattern}`,
          `description.imatch.${entry.pattern}`,
          `materials.imatch.${entry.pattern}`,
        ];
        if (entry.categories.length > 0) conditions.push(`category_id.in.(${entry.categories.join(",")})`);
        if (entry.collections.length > 0) conditions.push(`collection_id.in.(${entry.collections.join(",")})`);
        if (entry.models.length > 0) conditions.push(`model_id.in.(${entry.models.join(",")})`);
        // Um .or() por palavra: todas as palavras precisam casar (E), cada uma em qualquer campo (OU).
        query = query.or(conditions.join(","));
      }
    }
    if (colorId) {
      query = query.eq("product_variants.color_id", colorId).neq("product_variants.status", "archived");
    }
    return query;
  };

  let { data, count, error } = await (await buildQuery("full"));
  if (error && searchTokens(search).length > 0) {
    // A busca completa falhou (ex.: filtro recusado pelo banco): repete só pelo nome, para a
    // cliente nunca ficar sem resultado por causa de um erro de busca.
    console.error("[listProducts] busca completa falhou, usando busca simples:", error.message);
    ({ data, count, error } = await (await buildQuery("simple")));
  }
  if (error || !data) return { products: [], total: 0, hasMore: false };

  // O join do filtro por cor pode repetir o produto quando ele tem mais de uma
  // variante da mesma cor; desduplica por id preservando a ordem.
  const seen = new Set<string>();
  const products = (data as unknown as { id: string; price: number }[]).filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const decorated = await withCardData(supabase, storeId, products);

  return {
    products: decorated as unknown as (ProductListItem & { cover_image_url: string | null })[],
    total: count ?? 0,
    hasMore: (count ?? 0) > to + 1,
  };
}

export async function getFeaturedProducts(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, status")
    .eq("store_id", storeId)
    .in("status", PUBLIC_STATUSES)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(8);

  if (!products) return [];
  return withCardData(supabase, storeId, products);
}

export async function getNewArrivals(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, status")
    .eq("store_id", storeId)
    .in("status", PUBLIC_STATUSES)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!products) return [];
  return withCardData(supabase, storeId, products);
}

/**
 * "Mais procuradas": as peças com mais cliques no WhatsApp e visualizações nos últimos 30 dias,
 * decididas no banco por get_popular_product_ids (migration 0043), que devolve só os IDs de peças
 * públicas, sem números. Exclui as que já aparecem em outras seções da página e só mostra a
 * seção com pelo menos 2 peças. Se a função ainda não existir ou falhar, devolve vazio: a seção
 * some, e o resto da página segue normal.
 */
export async function getPopularProducts(storeId: string, excludeIds: string[] = [], limit = 4) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("get_popular_product_ids", {
    p_store_id: storeId,
    p_days: 30,
    p_limit: 12,
  });
  if (error || !data) {
    console.warn("[catálogo] mais procuradas indisponível:", error?.message);
    return [];
  }

  const ids = data
    .map((row) => row.product_id)
    .filter((id) => !excludeIds.includes(id))
    .slice(0, limit);
  if (ids.length < 2) return [];

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, status")
    .eq("store_id", storeId)
    .in("id", ids)
    .in("status", PUBLIC_STATUSES);
  if (!products || products.length < 2) return [];

  // Mantém a ordem de procura devolvida pelo banco.
  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered = ids.map((id) => byId.get(id)).filter((product): product is (typeof products)[number] => Boolean(product));

  return withCardData(supabase, storeId, ordered);
}

/**
 * Peças relacionadas para a página de produto (PRD 3.4).
 *
 * Relevância por proximidade: mesma categoria primeiro, depois mesma coleção,
 * e o restante do catálogo completa se ainda faltar. Sempre exclui o próprio
 * produto. Uma loja pequena raramente tem 4 peças na mesma categoria, então
 * sem o preenchimento a seção apareceria quase sempre vazia.
 */
export async function getRelatedProducts(
  storeId: string,
  product: { id: string; category_id: string | null; collection_id: string | null },
  limit = 4,
) {
  const supabase = await createServerSupabaseClient();
  const selected = new Map<string, { id: string; name: string; slug: string; price: number; status: string }>();

  const fetchBatch = async (filter: (q: ReturnType<typeof buildBase>) => typeof q) => {
    if (selected.size >= limit) return;

    const { data } = await filter(buildBase());
    for (const row of data ?? []) {
      if (row.id !== product.id && !selected.has(row.id)) selected.set(row.id, row);
      if (selected.size >= limit) break;
    }
  };

  function buildBase() {
    return supabase
      .from("products")
      .select("id, name, slug, price, status")
      .eq("store_id", storeId)
      .in("status", PUBLIC_STATUSES)
      .neq("id", product.id)
      .order("sort_order", { ascending: true })
      .limit(limit + 1);
  }

  if (product.category_id) {
    await fetchBatch((q) => q.eq("category_id", product.category_id!));
  }
  if (product.collection_id) {
    await fetchBatch((q) => q.eq("collection_id", product.collection_id!));
  }
  await fetchBatch((q) => q);

  const products = [...selected.values()].slice(0, limit);
  if (products.length === 0) return [];

  return withCardData(supabase, storeId, products);
}

// cache() deduplica a chamada entre generateMetadata e o componente da página.
export const getProductBySlug = cache(async (storeId: string, slug: string) => {
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .in("status", PUBLIC_STATUSES)
    .single();

  if (error || !product) return null;

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, url, alt_text, is_cover, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id, name, color, color_id, variant_group, size, price, status, sort_order")
      .eq("product_id", product.id)
      .neq("status", "archived")
      .order("sort_order", { ascending: true }),
  ]);

  // Tom das cores cadastradas, para a bolinha ao lado da opção. Só as cores usadas por esta peça.
  const colorIds = [...new Set((variants ?? []).map((v) => v.color_id).filter((id): id is string => Boolean(id)))];
  const colorById = new Map<string, { hex: string; hex_secondary: string | null }>();
  if (colorIds.length > 0) {
    const { data: colors } = await supabase
      .from("colors")
      .select("id, hex, hex_secondary")
      .eq("store_id", storeId)
      .in("id", colorIds);
    for (const color of colors ?? []) colorById.set(color.id, color);
  }

  return {
    product,
    images: images ?? [],
    variants: (variants ?? []).map((variant) => {
      const color = variant.color_id ? colorById.get(variant.color_id) : undefined;
      return { ...variant, color_hex: color?.hex ?? null, color_hex_secondary: color?.hex_secondary ?? null };
    }),
  };
});
