import { describe, expect, it, vi, beforeEach } from "vitest";

// Regra inegociável do PRD: "excluir" no painel é UPDATE status, nunca DELETE.
type ProductUpdate = { status: string; archived_at: string | null };

// `.eq()` precisa ser encadeável: as actions filtram por id E por store_id.
const eqSpy = vi.fn<(column: string, value: string) => EqChain>();

type EqChain = { eq: typeof eqSpy } & Promise<{ error: null }>;

function makeChain(): EqChain {
  const chain = Promise.resolve({ error: null }) as EqChain;
  chain.eq = eqSpy;
  return chain;
}

eqSpy.mockImplementation(() => makeChain());

const updateSpy = vi.fn((payload: ProductUpdate) => {
  void payload; // capturado por mock.calls; a chain é o que a action encadeia
  return makeChain();
});
const deleteSpy = vi.fn(() => makeChain());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => ({ update: updateSpy, delete: deleteSpy }),
  }),
}));

import { deactivateProduct, restoreProduct } from "@/lib/products/actions";

beforeEach(() => {
  updateSpy.mockClear();
  deleteSpy.mockClear();
  eqSpy.mockClear();
});

describe("deactivateProduct", () => {
  it("seta status='inactive' e archived_at, sem nunca chamar delete", async () => {
    await deactivateProduct("product-1");

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const payload = updateSpy.mock.calls[0][0];
    expect(payload.status).toBe("inactive");
    expect(payload.archived_at).toBeTypeOf("string");
  });

  it("filtra também por store_id, não só pelo id vindo do client", async () => {
    await deactivateProduct("product-1");

    expect(eqSpy.mock.calls).toEqual([
      ["id", "product-1"],
      ["store_id", "store-1"],
    ]);
  });
});

describe("restoreProduct", () => {
  it("devolve o produto ao catálogo limpando archived_at", async () => {
    await restoreProduct("product-1");

    expect(deleteSpy).not.toHaveBeenCalled();

    const payload = updateSpy.mock.calls[0][0];
    expect(payload.status).toBe("available");
    expect(payload.archived_at).toBeNull();
  });
});
