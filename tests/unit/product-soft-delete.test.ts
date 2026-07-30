import { describe, expect, it, vi, beforeEach } from "vitest";

// Regra inegociável do PRD: "excluir" no painel é UPDATE status, nunca DELETE.
type ProductUpdate = { status: string; archived_at: string | null };

const updateSpy = vi.fn((payload: ProductUpdate) => ({
  eq: () => Promise.resolve({ error: null, payload }),
}));
const deleteSpy = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));

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
