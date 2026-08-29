import { beforeEach, describe, expect, it, vi } from "vitest";

const { inserted, state } = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  state: { activeCount: 0 },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-owner-store", () => ({
  getOwnerStore: async () => ({ id: "store-1", slug: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      const chain: Record<string, unknown> = {
        insert: (payload: Record<string, unknown>) => {
          inserted.push(payload);
          return chain;
        },
        select: () => chain,
        single: () => Promise.resolve({ data: { id: "novo" }, error: null }),
        update: () => chain,
        eq: () => chain,
        in: () => Promise.resolve({ count: state.activeCount }),
      };
      return chain;
    },
  }),
}));

async function submit(data: FormData) {
  try {
    return await createProduct({}, data);
  } catch {
    return {};
  }
}

import { createProduct } from "@/lib/products/actions";
import { FREE_PLAN_PRODUCT_LIMIT } from "@/lib/products/limits";

function form(fields: Record<string, string> = {}) {
  const data = new FormData();
  data.set("name", "Bolsa Teste");
  data.set("price", "100");
  data.set("status", "available");
  data.set("description", "");
  data.set("materials", "");
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  inserted.length = 0;
  state.activeCount = 0;
});

describe("limite do teste grátis", () => {
  it("permite criar quando abaixo do limite", async () => {
    state.activeCount = FREE_PLAN_PRODUCT_LIMIT - 1;

    // redirect() em caso de sucesso não é mockado para lançar (só registra a
    // chamada) — o sinal de sucesso aqui é o insert ter sido feito.
    await submit(form());

    expect(inserted).toHaveLength(1);
  });

  it("bloqueia a criação ao atingir o limite", async () => {
    state.activeCount = FREE_PLAN_PRODUCT_LIMIT;

    const result = await submit(form());

    expect(result.error).toContain(String(FREE_PLAN_PRODUCT_LIMIT));
    expect(inserted).toHaveLength(0);
  });

  it("bloqueia também acima do limite (defesa extra, não só ==)", async () => {
    state.activeCount = FREE_PLAN_PRODUCT_LIMIT + 3;

    const result = await submit(form());

    expect(result.error).toBeTruthy();
    expect(inserted).toHaveLength(0);
  });
});
