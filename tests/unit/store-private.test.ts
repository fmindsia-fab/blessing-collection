import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    row: null as Record<string, unknown> | null,
    table: "",
    filterColumn: "",
    filterValue: "",
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: (table: string) => {
      state.table = table;
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (column: string, value: string) => {
          state.filterColumn = column;
          state.filterValue = value;
          return chain;
        },
        maybeSingle: () => Promise.resolve({ data: state.row, error: null }),
      };
      return chain;
    },
  }),
}));

import { getStorePrivate, STORE_PRIVATE_DEFAULTS } from "@/lib/store/private";

describe("getStorePrivate", () => {
  beforeEach(() => {
    state.row = null;
    state.table = "";
  });

  it("lê de store_private (nunca de stores) filtrando pela loja", async () => {
    await getStorePrivate("loja-1");

    expect(state.table).toBe("store_private");
    expect(state.filterColumn).toBe("store_id");
    expect(state.filterValue).toBe("loja-1");
  });

  it("devolve o padrão vazio quando a loja ainda não salvou nada", async () => {
    expect(await getStorePrivate("loja-1")).toEqual(STORE_PRIVATE_DEFAULTS);
  });

  it("usa os valores salvos e completa o resto com o padrão", async () => {
    state.row = { pix_key: "11999999999", monthly_pay: 2500 };

    expect(await getStorePrivate("loja-1")).toEqual({
      ...STORE_PRIVATE_DEFAULTS,
      pix_key: "11999999999",
      monthly_pay: 2500,
    });
  });
});
