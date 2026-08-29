import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    /** null simula produto de outra loja. */
    product: { id: "p1" } as { id: string } | null,
    inserted: null as Record<string, unknown>[] | null,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/store/get-owner-store", () => ({
  getOwnerStore: async () => ({ id: "store-1", slug: "store-1" }),
}));
vi.mock("@/lib/store/revalidate-store-paths", () => ({ revalidateStorePaths: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {
        select: () => chain,
        insert: (rows: Record<string, unknown>[]) => {
          state.inserted = rows;
          return chain;
        },
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: table === "products" ? state.product : null }),
        then: (resolve: (r: { error: null }) => void) => Promise.resolve(resolve({ error: null })),
      };
      return chain;
    },
  }),
}));

import { createSizeVariants } from "@/lib/products/variant-actions";

function form(group: string, sizes: string[], extra: Record<string, string> = {}) {
  const data = new FormData();
  data.set("group", group);
  sizes.forEach((size) => data.append("sizes", size));
  for (const [key, value] of Object.entries(extra)) data.set(key, value);
  return data;
}

beforeEach(() => {
  state.product = { id: "p1" };
  state.inserted = null;
});

describe("createSizeVariants", () => {
  it("cria uma variante por tamanho marcado, no mesmo grupo", async () => {
    const result = await createSizeVariants("p1", {}, form("Tamanho", ["P", "M", "G"]));

    expect(result.error).toBeUndefined();
    expect(state.inserted).toHaveLength(3);
    expect(state.inserted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ product_id: "p1", name: "P", size: "P", variant_group: "Tamanho" }),
        expect.objectContaining({ product_id: "p1", name: "M", size: "M", variant_group: "Tamanho" }),
        expect.objectContaining({ product_id: "p1", name: "G", size: "G", variant_group: "Tamanho" }),
      ]),
    );
  });

  it("recusa quando nenhum tamanho é marcado", async () => {
    const result = await createSizeVariants("p1", {}, form("Numeração", []));

    expect(result.error).toBeTruthy();
    expect(state.inserted).toBeNull();
  });

  // A RLS bloquearia, mas a checagem explícita é a defesa da aplicação.
  it("recusa produto de outra loja", async () => {
    state.product = null;

    const result = await createSizeVariants("p1", {}, form("Tamanho", ["P"]));

    expect(result.error).toBe("Produto não encontrado.");
    expect(state.inserted).toBeNull();
  });
});
