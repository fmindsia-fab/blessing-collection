import { beforeEach, describe, expect, it, vi } from "vitest";

// Registra a ORDEM das operações destrutivas: o que importa aqui é que os pedidos
// saiam antes da loja (orders.customer_id é ON DELETE RESTRICT).
const { state } = vi.hoisted(() => ({
  state: {
    calls: [] as string[],
    ordersError: null as { message: string } | null,
    storeDeleteError: null as { message: string } | null,
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/platform/get-platform-admin", () => ({ isPlatformAdmin: async () => true }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "admin-1" } } }) },
  }),
}));

vi.mock("@/lib/platform/service-role-client", () => ({
  createPlatformServiceClient: () => ({
    storage: {
      from: () => ({
        list: async () => ({ data: [], error: null }),
        remove: async () => ({ error: null }),
      }),
    },
    auth: {
      admin: {
        deleteUser: async () => {
          state.calls.push("auth.deleteUser");
          return { error: null };
        },
      },
    },
    from: (table: string) => {
      const chain: Record<string, unknown> = {
        // contagem de lojas restantes do dono (head: true) — nenhuma
        select: (_columns?: string, options?: { head?: boolean }) =>
          options?.head ? { eq: async () => ({ count: 0 }) } : chain,
        eq: () => chain,
        maybeSingle: async () => {
          if (table === "stores") {
            return {
              data: {
                id: "loja-1",
                slug: "teste",
                owner_user_id: "dono-1",
                store_subscriptions: { status: "trialing", billing_type: "manual", stripe_subscription_id: null },
              },
            };
          }
          return { data: { is_platform_admin: false } }; // profiles
        },
        delete: () => {
          // Retorna um "thenable" que registra a tabela ao ser aguardado.
          const result = {
            eq: () => ({
              then: (resolve: (value: { error: unknown }) => void) => {
                state.calls.push(`delete:${table}`);
                const error =
                  table === "orders" ? state.ordersError : table === "stores" ? state.storeDeleteError : null;
                resolve({ error });
              },
            }),
          };
          return result;
        },
      };
      return chain;
    },
  }),
}));

import { deleteStoreAndAccount } from "@/lib/platform/delete-account";

describe("deleteStoreAndAccount — ordem das exclusões", () => {
  beforeEach(() => {
    state.calls = [];
    state.ordersError = null;
    state.storeDeleteError = null;
  });

  it("apaga os pedidos ANTES da loja, e o usuário por último", async () => {
    const result = await deleteStoreAndAccount("loja-1", "teste");

    expect(result).toEqual({ success: true });
    expect(state.calls).toEqual(["delete:orders", "delete:stock_movements", "delete:purchases", "delete:stores", "auth.deleteUser"]);
  });

  it("se os pedidos não puderem ser apagados, não toca na loja nem no usuário", async () => {
    state.ordersError = { message: "falhou" };

    const result = await deleteStoreAndAccount("loja-1", "teste");

    expect(result.error).toMatch(/pedidos/i);
    expect(state.calls).toEqual(["delete:orders"]);
  });

  it("exige o endereço digitado exatamente e não apaga nada se não conferir", async () => {
    const result = await deleteStoreAndAccount("loja-1", "outro-nome");

    expect(result.error).toMatch(/não confere/i);
    expect(state.calls).toEqual([]);
  });
});
