import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
    fromCalls: 0,
    rpcResult: { data: { consumed: 0, returned: 0, shortages: [] }, error: null } as {
      data: unknown;
      error: { code?: string; message: string } | null;
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "loja-1" }),
}));
vi.mock("@/lib/store/ownership", () => ({ getNotOwnerError: async () => null }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    // Qualquer acesso direto a tabela seria um DELETE/UPDATE fora da função do banco.
    from: () => {
      state.fromCalls += 1;
      return {};
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ name, args });
      return state.rpcResult;
    },
  }),
}));

import { cancelOrder, updateOrderStatus } from "@/lib/orders/actions";

describe("situação do pedido (baixa de estoque na mesma transação)", () => {
  beforeEach(() => {
    state.rpcCalls = [];
    state.fromCalls = 0;
    state.rpcResult = { data: { consumed: 0, returned: 0, shortages: [] }, error: null };
  });

  it("cancelar usa a função do banco, filtra pela loja e nunca apaga", async () => {
    await cancelOrder("pedido-1");

    expect(state.rpcCalls).toEqual([
      {
        name: "set_order_status",
        args: { p_store_id: "loja-1", p_order_id: "pedido-1", p_status: "cancelled", p_return_stock: null },
      },
    ]);
    expect(state.fromCalls).toBe(0);
  });

  it("cancelar pedido que baixou estoque repassa a escolha de devolver os insumos", async () => {
    await cancelOrder("pedido-1", true);
    await cancelOrder("pedido-2", false);

    expect(state.rpcCalls.map((call) => call.args.p_return_stock)).toEqual([true, false]);
  });

  it("reabrir volta o pedido como orçamento", async () => {
    await updateOrderStatus("pedido-1", "quote");

    expect(state.rpcCalls[0].args).toMatchObject({ p_status: "quote", p_order_id: "pedido-1" });
  });

  it("recusa situação inválida sem chamar o banco", async () => {
    const result = await updateOrderStatus("pedido-1", "qualquer-coisa");

    expect(result.error).toBeTruthy();
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("devolve o aviso de materiais que ficaram faltando", async () => {
    state.rpcResult = {
      data: { consumed: 2, returned: 0, shortages: [{ name: "Fio", unit: "g", short: 150 }] },
      error: null,
    };

    const result = await updateOrderStatus("pedido-1", "in_production");

    expect(result.consumed).toBe(2);
    expect(result.shortages).toEqual([{ name: "Fio", unit: "g", short: 150 }]);
  });

  it("mostra a mensagem do banco quando ela é de propósito, e uma genérica nos outros erros", async () => {
    state.rpcResult = { data: null, error: { code: "P0001", message: "Pedido não encontrado." } };
    expect((await updateOrderStatus("x", "quote")).error).toBe("Pedido não encontrado.");

    state.rpcResult = { data: null, error: { code: "XX000", message: "detalhe interno do banco" } };
    expect((await updateOrderStatus("x", "quote")).error).toBe("Não foi possível mudar a situação do pedido.");
  });
});
