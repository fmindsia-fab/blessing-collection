import { beforeEach, describe, expect, it, vi } from "vitest";

// Duas categorias na lista global. Arrastar acontece dentro de um grupo, então
// mover uma bolsa não pode deslocar os acessórios.
let rows = [
  { id: "bolsa1", sort_order: 0, created_at: "2026-07-05" },
  { id: "bolsa2", sort_order: 1, created_at: "2026-07-04" },
  { id: "bolsa3", sort_order: 2, created_at: "2026-07-03" },
  { id: "acess1", sort_order: 3, created_at: "2026-07-02" },
  { id: "acess2", sort_order: 4, created_at: "2026-07-01" },
];

const updates: { id: string; sort_order: number }[] = [];

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-owner-store", () => ({
  getOwnerStore: async () => ({ id: "store-1", slug: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      let pendingUpdate: { sort_order?: number } | null = null;
      let targetId: string | null = null;

      const chain = {
        select: () => chain,
        update: (payload: { sort_order?: number }) => {
          pendingUpdate = payload;
          return chain;
        },
        eq: (column: string, value: string) => {
          if (column === "id") targetId = value;
          if (pendingUpdate && targetId && column === "store_id") {
            updates.push({ id: targetId, sort_order: pendingUpdate.sort_order! });
          }
          return chain;
        },
        order: () => chain,
        then: (resolve: (r: { data: unknown; error: null }) => void) =>
          Promise.resolve(resolve({ data: rows, error: null })),
      };
      return chain;
    },
  }),
}));

import { reorderProducts } from "@/lib/products/actions";

function positionOf(id: string) {
  return updates.find((u) => u.id === id)?.sort_order;
}

beforeEach(() => {
  updates.length = 0;
  rows = [
    { id: "bolsa1", sort_order: 0, created_at: "2026-07-05" },
    { id: "bolsa2", sort_order: 1, created_at: "2026-07-04" },
    { id: "bolsa3", sort_order: 2, created_at: "2026-07-03" },
    { id: "acess1", sort_order: 3, created_at: "2026-07-02" },
    { id: "acess2", sort_order: 4, created_at: "2026-07-01" },
  ];
});

describe("reorderProducts", () => {
  it("aplica a ordem recebida ao grupo arrastado", async () => {
    // A terceira bolsa foi arrastada para o topo do próprio grupo.
    await reorderProducts(["bolsa3", "bolsa1", "bolsa2"]);

    expect(positionOf("bolsa3")).toBe(0);
    expect(positionOf("bolsa1")).toBe(1);
    expect(positionOf("bolsa2")).toBe(2);
  });

  // O grupo ocupa faixas fixas da lista global; arrastar dentro dele não pode
  // empurrar as outras categorias para outras posições.
  it("preserva a posição das peças de outras categorias", async () => {
    await reorderProducts(["bolsa3", "bolsa1", "bolsa2"]);

    expect(positionOf("acess1")).toBe(3);
    expect(positionOf("acess2")).toBe(4);
  });

  it("grava a sequência densa, sem buracos nem repetição", async () => {
    await reorderProducts(["bolsa2", "bolsa3", "bolsa1"]);

    expect(updates.map((u) => u.sort_order).sort()).toEqual([0, 1, 2, 3, 4]);
  });

  // Os ids vêm do client: um id de outra loja não pode entrar na gravação.
  it("descarta ids que não pertencem à loja ativa", async () => {
    await reorderProducts(["bolsa2", "invasor", "bolsa1"]);

    expect(updates.some((u) => u.id === "invasor")).toBe(false);
    expect(positionOf("bolsa2")).toBe(0);
    expect(positionOf("bolsa1")).toBe(1);
  });

  it("não grava quando sobra menos de dois itens válidos", async () => {
    await reorderProducts(["bolsa1", "fantasma"]);

    expect(updates).toEqual([]);
  });

  it("ignora lista vazia ou de um item só", async () => {
    await reorderProducts([]);
    await reorderProducts(["bolsa1"]);

    expect(updates).toEqual([]);
  });
});
