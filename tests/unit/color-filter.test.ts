import { describe, expect, it, vi } from "vitest";

// Cores cadastradas na loja (migration 0013). "Bronze" existe mas nenhuma peça
// pública a usa — não pode aparecer no filtro.
const COLORS = [
  { id: "c1", name: "Caramelo", slug: "caramelo", hex: "#8B5A2B", hex_secondary: null },
  { id: "c2", name: "Preto", slug: "preto", hex: "#111111", hex_secondary: null },
  { id: "c3", name: "Lilás - Branco", slug: "lilas-branco", hex: "#C3B3D6", hex_secondary: "#F0EAE0" },
  { id: "c4", name: "Bronze", slug: "bronze", hex: "#9C6B3F", hex_secondary: null },
];

// "Caramelo" aparece em 3 variantes, mas de apenas 2 produtos distintos —
// o filtro por cor devolve produtos, então a contagem precisa refletir isso.
const VARIANTS = [
  { color_id: "c1", product_id: "p1" },
  { color_id: "c1", product_id: "p1" },
  { color_id: "c1", product_id: "p2" },
  { color_id: "c2", product_id: "p3" },
  { color_id: "c3", product_id: "p4" },
  { color_id: null, product_id: "p5" },
];

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      const data = table === "colors" ? COLORS : VARIANTS;
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        neq: () => chain,
        not: () => chain,
        order: () => chain,
        then: (resolve: (r: { data: unknown }) => void) => Promise.resolve(resolve({ data })),
      };
      return chain;
    },
  }),
}));

import { listColorsInUse } from "@/lib/products/queries";

describe("listColorsInUse", () => {
  it("conta produtos distintos, não variantes", async () => {
    const colors = await listColorsInUse("store-1");
    expect(colors.find((c) => c.slug === "caramelo")?.count).toBe(2);
  });

  // Mesmo motivo de listModelsInUse: opção sem resultado é beco sem saída.
  it("omite cor cadastrada que nenhuma peça pública usa", async () => {
    const colors = await listColorsInUse("store-1");
    expect(colors.map((c) => c.slug)).not.toContain("bronze");
    expect(colors).toHaveLength(3);
  });

  it("ignora variantes sem cor vinculada", async () => {
    const colors = await listColorsInUse("store-1");
    expect(colors.every((c) => c.count > 0)).toBe(true);
  });

  it("expõe o hex para a amostra visual, com a segunda cor das compostas", async () => {
    const colors = await listColorsInUse("store-1");

    expect(colors.find((c) => c.slug === "preto")).toMatchObject({
      hex: "#111111",
      hexSecondary: null,
    });
    expect(colors.find((c) => c.slug === "lilas-branco")).toMatchObject({
      hex: "#C3B3D6",
      hexSecondary: "#F0EAE0",
    });
  });

  // A ordem vem do sort_order definido no painel, não alfabética.
  it("preserva a ordem devolvida pelo banco", async () => {
    const colors = await listColorsInUse("store-1");
    expect(colors.map((c) => c.slug)).toEqual(["caramelo", "preto", "lilas-branco"]);
  });
});
