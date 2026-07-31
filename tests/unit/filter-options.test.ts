import { describe, expect, it, vi } from "vitest";

// 14 modelos cadastrados, produtos em apenas 2 — o cenário real da loja.
const MODELS = [
  { id: "m1", name: "Clutch", slug: "clutch" },
  { id: "m2", name: "Tote", slug: "tote" },
  { id: "m3", name: "Mochila", slug: "mochila" },
];

const PRODUCTS_WITH_MODEL = [
  { model_id: "m1" },
  { model_id: "m1" },
  { model_id: "m2" },
];

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        not: () => chain,
        neq: () => chain,
        order: () => chain,
        then: (resolve: (r: { data: unknown }) => void) =>
          Promise.resolve(resolve({ data: table === "models" ? MODELS : PRODUCTS_WITH_MODEL })),
      };
      return chain;
    },
  }),
}));

import { listModelsInUse } from "@/lib/models/queries";

describe("listModelsInUse", () => {
  // Sem isso, a cliente clica em "Mochila" e vê "0 peças encontradas".
  it("omite modelos sem nenhuma peça no catálogo", async () => {
    const models = await listModelsInUse("store-1");
    const slugs = models.map((m) => m.slug);

    expect(slugs).toContain("clutch");
    expect(slugs).toContain("tote");
    expect(slugs).not.toContain("mochila");
  });

  it("conta quantas peças cada modelo tem", async () => {
    const models = await listModelsInUse("store-1");

    expect(models.find((m) => m.slug === "clutch")?.count).toBe(2);
    expect(models.find((m) => m.slug === "tote")?.count).toBe(1);
  });

  it("preserva a ordem definida no painel", async () => {
    const models = await listModelsInUse("store-1");
    expect(models.map((m) => m.slug)).toEqual(["clutch", "tote"]);
  });
});
