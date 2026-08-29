import { describe, expect, it, vi } from "vitest";

const PRODUCTS = [
  { slug: "bolsa-florence", updated_at: "2026-07-01T10:00:00Z" },
  { slug: "clutch-aurora", updated_at: "2026-07-15T10:00:00Z" },
];
const CATEGORIES = [{ slug: "clutch", updated_at: "2026-06-01T10:00:00Z" }];
const COLLECTIONS = [{ slug: "verao-2026", updated_at: "2026-06-10T10:00:00Z" }];

// Registra os filtros aplicados, para provar que itens ocultos ficam de fora.
const applied: { table: string; filters: Record<string, unknown> }[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      const rows =
        table === "products" ? PRODUCTS : table === "categories" ? CATEGORIES : COLLECTIONS;

      const chain = {
        select: () => chain,
        eq: (column: string, value: unknown) => {
          filters[column] = value;
          return chain;
        },
        in: (column: string, value: unknown) => {
          filters[column] = value;
          return chain;
        },
        then: (resolve: (r: { data: unknown }) => void) => {
          applied.push({ table, filters });
          return Promise.resolve(resolve({ data: rows }));
        },
      };
      return chain;
    },
  }),
}));

import { getSitemapEntries, absoluteUrl } from "@/lib/seo/sitemap-entries";
import robots from "@/app/robots";

describe("getSitemapEntries", () => {
  it("inclui home, listagem, produtos, categorias e coleções, prefixados por /loja/{slug}", async () => {
    const entries = await getSitemapEntries("store-1", "blessing-collection");
    const paths = entries.map((e) => e.path);

    expect(paths).toContain("/loja/blessing-collection");
    expect(paths).toContain("/loja/blessing-collection/produtos");
    expect(paths).toContain("/loja/blessing-collection/produtos/bolsa-florence");
    expect(paths).toContain("/loja/blessing-collection/categorias/clutch");
    expect(paths).toContain("/loja/blessing-collection/colecoes/verao-2026");
  });

  it("dá prioridade máxima à home da loja", async () => {
    const entries = await getSitemapEntries("store-1", "blessing-collection");
    const home = entries.find((e) => e.path === "/loja/blessing-collection");

    expect(home?.priority).toBe(1);
  });

  it("usa updated_at de cada item como lastModified", async () => {
    const entries = await getSitemapEntries("store-1", "blessing-collection");
    const product = entries.find((e) => e.path === "/loja/blessing-collection/produtos/clutch-aurora");

    expect(product?.lastModified.toISOString()).toBe("2026-07-15T10:00:00.000Z");
  });

  // Produto inativo indexado seria um link morto no Google.
  it("filtra por status público e pela loja ativa", async () => {
    applied.length = 0;
    await getSitemapEntries("store-1", "blessing-collection");

    const products = applied.find((a) => a.table === "products");
    expect(products?.filters["store_id"]).toBe("store-1");
    expect(products?.filters["status"]).toEqual(["available", "made_to_order", "sold_out"]);

    const categories = applied.find((a) => a.table === "categories");
    expect(categories?.filters["status"]).toBe("active");
  });
});

describe("absoluteUrl", () => {
  it("não gera barra dupla", () => {
    expect(absoluteUrl("https://loja.com/", "/produtos")).toBe("https://loja.com/produtos");
    expect(absoluteUrl("https://loja.com", "/produtos")).toBe("https://loja.com/produtos");
  });

  it("devolve a base para a home", () => {
    expect(absoluteUrl("https://loja.com", "/")).toBe("https://loja.com");
  });
});

describe("robots", () => {
  it("bloqueia painel, login, cadastro e a página de seleção de qualquer loja", () => {
    const result = robots();
    const disallow = result.rules as { disallow: string[] };

    expect(disallow.disallow).toContain("/admin");
    expect(disallow.disallow).toContain("/login");
    expect(disallow.disallow).toContain("/cadastro");
    expect(disallow.disallow).toContain("/loja/*/selecao");
  });

  it("libera o catálogo público", () => {
    const result = robots();
    const rules = result.rules as { allow: string };

    expect(rules.allow).toBe("/");
  });
});
