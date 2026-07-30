import { beforeEach, describe, expect, it, vi } from "vitest";

// Ordem inicial com sort_order duplicado (0): produtos criados depois nascem
// com 0, então a reordenação precisa reescrever a sequência inteira em vez de
// só trocar dois valores.
let rows = [
  { id: "a", sort_order: 0, created_at: "2026-07-03" },
  { id: "b", sort_order: 0, created_at: "2026-07-02" },
  { id: "c", sort_order: 0, created_at: "2026-07-01" },
];

const updates: { id: string; sort_order: number }[] = [];

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
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

import { moveProduct } from "@/lib/products/actions";

beforeEach(() => {
  updates.length = 0;
  rows = [
    { id: "a", sort_order: 0, created_at: "2026-07-03" },
    { id: "b", sort_order: 0, created_at: "2026-07-02" },
    { id: "c", sort_order: 0, created_at: "2026-07-01" },
  ];
});

describe("moveProduct", () => {
  it("desce um produto trocando com o vizinho seguinte", async () => {
    await moveProduct("a", "down");

    // a e b trocam: b assume 0, a assume 1, c permanece em 2.
    expect(updates).toEqual([
      { id: "b", sort_order: 0 },
      { id: "a", sort_order: 1 },
      { id: "c", sort_order: 2 },
    ]);
  });

  it("sobe um produto trocando com o vizinho anterior", async () => {
    await moveProduct("c", "up");

    expect(updates).toEqual([
      { id: "a", sort_order: 0 },
      { id: "c", sort_order: 1 },
      { id: "b", sort_order: 2 },
    ]);
  });

  // Sem isso, subir o primeiro item embaralharia a lista silenciosamente.
  it("ignora subir o primeiro item", async () => {
    await moveProduct("a", "up");
    expect(updates).toEqual([]);
  });

  it("ignora descer o último item", async () => {
    await moveProduct("c", "down");
    expect(updates).toEqual([]);
  });

  it("ignora id inexistente", async () => {
    await moveProduct("nao-existe", "up");
    expect(updates).toEqual([]);
  });

  it("reescreve a sequência densa mesmo com sort_order duplicado na origem", async () => {
    await moveProduct("b", "up");

    const positions = updates.map((u) => u.sort_order).sort();
    expect(positions).toEqual([0, 1, 2]);
  });
});
