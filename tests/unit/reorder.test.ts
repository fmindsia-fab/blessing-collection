import { beforeEach, describe, expect, it, vi } from "vitest";

// Ordem inicial com sort_order duplicado (0): produtos criados depois nascem
// com 0, então a reordenação precisa reescrever a sequência inteira em vez de
// só trocar dois valores.
const MESMA_CATEGORIA = [
  { id: "a", sort_order: 0, created_at: "2026-07-03", category_id: "cat1" },
  { id: "b", sort_order: 0, created_at: "2026-07-02", category_id: "cat1" },
  { id: "c", sort_order: 0, created_at: "2026-07-01", category_id: "cat1" },
];

let rows: {
  id: string;
  sort_order: number;
  created_at: string;
  category_id: string | null;
}[] = [...MESMA_CATEGORIA];

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

import { moveProduct } from "@/lib/products/actions";

beforeEach(() => {
  updates.length = 0;
  rows = [...MESMA_CATEGORIA];
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

// O painel agrupa a listagem por categoria. Se a seta operasse na lista global,
// ela faria algo diferente do que a tela mostra: subir a primeira peça de um
// grupo a mandaria para dentro do grupo anterior.
describe("moveProduct com a listagem agrupada por categoria", () => {
  beforeEach(() => {
    updates.length = 0;
    rows = [
      { id: "bolsa1", sort_order: 0, created_at: "2026-07-05", category_id: "bolsas" },
      { id: "bolsa2", sort_order: 1, created_at: "2026-07-04", category_id: "bolsas" },
      { id: "acess1", sort_order: 2, created_at: "2026-07-03", category_id: "acessorios" },
      { id: "acess2", sort_order: 3, created_at: "2026-07-02", category_id: "acessorios" },
      { id: "solta", sort_order: 4, created_at: "2026-07-01", category_id: null },
    ];
  });

  it("não move a primeira peça do grupo para dentro do grupo anterior", async () => {
    await moveProduct("acess1", "up");

    expect(updates).toEqual([]);
  });

  it("não move a última peça do grupo para dentro do grupo seguinte", async () => {
    await moveProduct("bolsa2", "down");

    expect(updates).toEqual([]);
  });

  it("troca com o vizinho da mesma categoria", async () => {
    await moveProduct("acess2", "up");

    // acess1 e acess2 trocam de lugar; os demais mantêm a posição.
    expect(updates).toEqual([
      { id: "bolsa1", sort_order: 0 },
      { id: "bolsa2", sort_order: 1 },
      { id: "acess2", sort_order: 2 },
      { id: "acess1", sort_order: 3 },
      { id: "solta", sort_order: 4 },
    ]);
  });

  // "Sem categoria" é um grupo como os outros na tela.
  it("trata peças sem categoria como um grupo próprio", async () => {
    await moveProduct("solta", "up");

    expect(updates).toEqual([]);
  });
});
