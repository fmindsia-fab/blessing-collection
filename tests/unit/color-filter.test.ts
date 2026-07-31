import { describe, expect, it, vi } from "vitest";

// "Caramelo" aparece em 3 variantes, mas de apenas 2 produtos distintos —
// o filtro por cor devolve produtos, então a contagem precisa refletir isso.
const VARIANTS = [
  { color: "Caramelo", product_id: "p1" },
  { color: "Caramelo", product_id: "p1" },
  { color: "Caramelo", product_id: "p2" },
  { color: "Preto", product_id: "p3" },
  { color: "  Azul  ", product_id: "p4" },
  { color: null, product_id: "p5" },
];

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        neq: () => chain,
        not: () => chain,
        order: () => chain,
        then: (resolve: (r: { data: unknown }) => void) =>
          Promise.resolve(resolve({ data: VARIANTS })),
      };
      return chain;
    },
  }),
}));

import { listAvailableColors } from "@/lib/products/queries";

describe("listAvailableColors", () => {
  it("conta produtos distintos, não variantes", async () => {
    const colors = await listAvailableColors("store-1");
    expect(colors.find((c) => c.name === "Caramelo")?.count).toBe(2);
  });

  it("normaliza espaços em volta do nome da cor", async () => {
    const colors = await listAvailableColors("store-1");
    expect(colors.map((c) => c.name)).toContain("Azul");
  });

  it("ignora variantes sem cor", async () => {
    const colors = await listAvailableColors("store-1");
    expect(colors.map((c) => c.name)).not.toContain(null);
    expect(colors).toHaveLength(3);
  });

  it("ordena alfabeticamente em pt-BR", async () => {
    const colors = await listAvailableColors("store-1");
    expect(colors.map((c) => c.name)).toEqual(["Azul", "Caramelo", "Preto"]);
  });
});
