import { beforeEach, describe, expect, it, vi } from "vitest";

const CATALOG = [
  { id: "p1", name: "Alvo", slug: "alvo", price: 100, status: "available", category_id: "c1", collection_id: "x1" },
  { id: "p2", name: "Mesma categoria", slug: "b", price: 200, status: "available", category_id: "c1", collection_id: null },
  { id: "p3", name: "Mesma coleção", slug: "c", price: 300, status: "available", category_id: "c9", collection_id: "x1" },
  { id: "p4", name: "Sem relação A", slug: "d", price: 400, status: "available", category_id: "c9", collection_id: null },
  { id: "p5", name: "Sem relação B", slug: "e", price: 500, status: "available", category_id: null, collection_id: null },
];

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      if (table === "product_images") {
        const imgChain = {
          select: () => imgChain,
          in: () => imgChain,
          eq: () => Promise.resolve({ data: [] }),
        };
        return imgChain;
      }

      const filters: Record<string, unknown> = {};
      const chain = {
        select: () => chain,
        eq: (col: string, val: unknown) => {
          filters[col] = val;
          return chain;
        },
        neq: (col: string, val: unknown) => {
          filters[`neq_${col}`] = val;
          return chain;
        },
        in: () => chain,
        order: () => chain,
        limit: () => chain,
        then: (resolve: (r: { data: unknown }) => void) => {
          const rows = CATALOG.filter((p) => {
            if (filters["neq_id"] && p.id === filters["neq_id"]) return false;
            if (filters["category_id"] && p.category_id !== filters["category_id"]) return false;
            if (filters["collection_id"] && p.collection_id !== filters["collection_id"]) return false;
            return true;
          });
          return Promise.resolve(resolve({ data: rows }));
        },
      };
      return chain;
    },
  }),
}));

import { getRelatedProducts } from "@/lib/products/queries";

const TARGET = { id: "p1", category_id: "c1", collection_id: "x1" };

beforeEach(() => vi.clearAllMocks());

describe("getRelatedProducts", () => {
  it("nunca inclui o próprio produto", async () => {
    const related = await getRelatedProducts("store-1", TARGET);
    expect(related.map((p) => p.id)).not.toContain("p1");
  });

  it("prioriza a mesma categoria", async () => {
    const related = await getRelatedProducts("store-1", TARGET);
    expect(related[0]?.id).toBe("p2");
  });

  // Uma loja pequena raramente tem 4 peças na mesma categoria; sem o
  // preenchimento a seção apareceria quase sempre vazia.
  it("completa com o restante do catálogo até o limite", async () => {
    const related = await getRelatedProducts("store-1", TARGET, 4);
    expect(related).toHaveLength(4);
  });

  it("não repete produtos entre as rodadas de busca", async () => {
    const related = await getRelatedProducts("store-1", TARGET);
    const ids = related.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("respeita o limite pedido", async () => {
    const related = await getRelatedProducts("store-1", TARGET, 2);
    expect(related).toHaveLength(2);
  });

  it("funciona para produto sem categoria nem coleção", async () => {
    const related = await getRelatedProducts("store-1", {
      id: "p5",
      category_id: null,
      collection_id: null,
    });

    expect(related.length).toBeGreaterThan(0);
    expect(related.map((p) => p.id)).not.toContain("p5");
  });
});
