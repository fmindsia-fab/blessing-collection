import { beforeEach, describe, expect, it, vi } from "vitest";

// Guarda a faixa pedida ao banco: é o que decide se "Carregar mais" estende a
// lista ou troca de página.
const calls: { from: number; to: number }[] = [];
let totalCount = 30;

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        neq: () => chain,
        not: () => chain,
        ilike: () => chain,
        order: () => chain,
        range: (from: number, to: number) => {
          calls.push({ from, to });
          return chain;
        },
        then: (resolve: (r: { data: unknown; count: number; error: null }) => void) =>
          Promise.resolve(resolve({ data: [], count: totalCount, error: null })),
      };
      return chain;
    },
  }),
}));

import { listProducts, PAGE_SIZE } from "@/lib/products/queries";

beforeEach(() => {
  calls.length = 0;
  totalCount = 30;
});

describe("listProducts — paginação acumulada", () => {
  it("busca a primeira fatia na página 1", async () => {
    await listProducts({ storeId: "store-1", page: 1 });

    expect(calls[0]).toEqual({ from: 0, to: PAGE_SIZE - 1 });
  });

  // "Carregar mais" estende a lista: a página 2 precisa trazer as 24 primeiras
  // peças, não as 12 da segunda fatia — senão a grade troca de conteúdo e a
  // cliente perde de vista o que já tinha rolado.
  it("acumula desde a primeira peça nas páginas seguintes", async () => {
    await listProducts({ storeId: "store-1", page: 2 });

    expect(calls[0]).toEqual({ from: 0, to: 2 * PAGE_SIZE - 1 });
  });

  it("segue acumulando na terceira página", async () => {
    await listProducts({ storeId: "store-1", page: 3 });

    expect(calls[0]).toEqual({ from: 0, to: 3 * PAGE_SIZE - 1 });
  });

  it("sinaliza que ainda há peças além das carregadas", async () => {
    const { hasMore } = await listProducts({ storeId: "store-1", page: 1 });

    expect(hasMore).toBe(true);
  });

  it("não oferece mais peças quando tudo já foi carregado", async () => {
    totalCount = 20;

    const { hasMore } = await listProducts({ storeId: "store-1", page: 2 });

    expect(hasMore).toBe(false);
  });
});
