import { beforeEach, describe, expect, it, vi } from "vitest";
import { slugify } from "@/lib/utils";

const { state } = vi.hoisted(() => ({
  state: {
    product: { name: "Veneza", slug: "teste-3" } as { name: string; slug: string } | null,
    updated: null as string | null,
    updateFails: false,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      let payload: { slug?: string } | null = null;
      const chain: Record<string, unknown> = {
        select: () => chain,
        update: (data: { slug?: string }) => {
          payload = data;
          return chain;
        },
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: state.product }),
        then: (resolve: (r: { error: unknown }) => void) => {
          if (payload?.slug) state.updated = payload.slug;
          return Promise.resolve(
            resolve({ error: state.updateFails ? { code: "23505" } : null }),
          );
        },
      };
      return chain;
    },
  }),
}));

import { refreshProductSlug } from "@/lib/products/actions";

beforeEach(() => {
  state.product = { name: "Veneza", slug: "teste-3" };
  state.updated = null;
  state.updateFails = false;
});

describe("slugify", () => {
  it("remove acentos e normaliza espaços", () => {
    expect(slugify("Bolsa de Mão")).toBe("bolsa-de-mao");
    expect(slugify("Bucket bag — Bolsa saco")).toBe("bucket-bag-bolsa-saco");
  });

  it("descarta pontuação nas bordas", () => {
    expect(slugify("  Veneza!  ")).toBe("veneza");
  });
});

describe("refreshProductSlug", () => {
  // Caso real: peça criada como "Teste 3" e renomeada para "Veneza".
  it("regenera o slug a partir do nome atual", async () => {
    const result = await refreshProductSlug("p1");

    expect(result.error).toBeUndefined();
    expect(state.updated).toBe("veneza");
  });

  it("não grava quando o slug já corresponde ao nome", async () => {
    state.product = { name: "Veneza", slug: "veneza" };

    const result = await refreshProductSlug("p1");

    expect(result.error).toBeUndefined();
    expect(state.updated).toBeNull();
  });

  // unique(store_id, slug) na migration 0001.
  it("avisa quando outra peça já usa a URL", async () => {
    state.updateFails = true;

    const result = await refreshProductSlug("p1");

    expect(result.error).toContain("Já existe uma peça com essa URL");
  });

  it("recusa nome que não gera URL válida", async () => {
    state.product = { name: "!!!", slug: "antigo" };

    const result = await refreshProductSlug("p1");

    expect(result.error).toBeTruthy();
    expect(state.updated).toBeNull();
  });

  it("recusa produto de outra loja", async () => {
    state.product = null;

    const result = await refreshProductSlug("p1");

    expect(result.error).toBe("Produto não encontrado.");
  });
});
