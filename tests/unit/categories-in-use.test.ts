import { describe, expect, it, vi } from "vitest";

// A loja tem 5 categorias cadastradas, mas peças públicas em apenas 2.
const CATEGORIES = [
  { id: "cat1", name: "Bolsas", slug: "bolsas" },
  { id: "cat2", name: "Acessórios", slug: "acessorios" },
  { id: "cat3", name: "Joias e Bijuterias", slug: "joias-e-bijuterias" },
  { id: "cat4", name: "Organizadores", slug: "organizadores" },
  { id: "cat5", name: "Kits e Presentes", slug: "kits-e-presentes" },
];

const PRODUCTS = [
  ...Array.from({ length: 11 }, () => ({ category_id: "cat1" })),
  ...Array.from({ length: 8 }, () => ({ category_id: "cat2" })),
  { category_id: null },
];

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      const data = table === "categories" ? CATEGORIES : PRODUCTS;
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        not: () => chain,
        order: () => chain,
        then: (resolve: (r: { data: unknown }) => void) => Promise.resolve(resolve({ data })),
      };
      return chain;
    },
  }),
}));

import { listCategoriesInUse } from "@/lib/categories/queries";

describe("listCategoriesInUse", () => {
  // Uma opção que devolve "nenhuma peça encontrada" é beco sem saída.
  it("omite categorias sem peça pública", async () => {
    const categories = await listCategoriesInUse("store-1");

    expect(categories.map((c) => c.slug)).toEqual(["bolsas", "acessorios"]);
  });

  it("conta as peças de cada categoria", async () => {
    const categories = await listCategoriesInUse("store-1");

    expect(categories.find((c) => c.slug === "bolsas")?.count).toBe(11);
    expect(categories.find((c) => c.slug === "acessorios")?.count).toBe(8);
  });
});
