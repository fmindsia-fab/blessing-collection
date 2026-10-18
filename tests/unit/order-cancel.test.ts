import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    updates: [] as Record<string, unknown>[],
    filters: [] as [string, unknown][],
    deletes: 0,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "loja-1" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      const chain: Record<string, unknown> = {
        update: (payload: Record<string, unknown>) => {
          state.updates.push(payload);
          return chain;
        },
        delete: () => {
          state.deletes += 1;
          return chain;
        },
        eq: (column: string, value: unknown) => {
          state.filters.push([column, value]);
          return chain;
        },
      };
      return chain;
    },
  }),
}));

import { cancelOrder, updateOrderStatus } from "@/lib/orders/actions";

describe("cancelar e reabrir pedido", () => {
  beforeEach(() => {
    state.updates = [];
    state.filters = [];
    state.deletes = 0;
  });

  it("cancelar só troca o status (nunca apaga) e filtra pela loja", async () => {
    await cancelOrder("pedido-1");

    expect(state.updates).toEqual([{ status: "cancelled", delivered_at: null }]);
    expect(state.filters).toEqual([
      ["id", "pedido-1"],
      ["store_id", "loja-1"],
    ]);
    expect(state.deletes).toBe(0);
  });

  it("reabrir volta o pedido como orçamento", async () => {
    await updateOrderStatus("pedido-1", "quote");

    expect(state.updates).toEqual([{ status: "quote", delivered_at: null }]);
  });
});
