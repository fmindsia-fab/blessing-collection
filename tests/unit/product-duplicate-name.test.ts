import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    sameStore: null as { id: string; archived_at: string | null } | null,
    // Erros devolvidos pelos inserts, na ordem das tentativas.
    insertErrors: [] as ({ code: string } | null)[],
    insertedSlugs: [] as string[],
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "store-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => {
      let attemptedSlug = "";
      const chain: Record<string, unknown> = {
        insert: (payload: { slug: string }) => {
          attemptedSlug = payload.slug;
          state.insertedSlugs.push(payload.slug);
          return chain;
        },
        select: () => chain,
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: state.sameStore, error: null }),
        single: () => {
          const error = state.insertErrors.shift() ?? null;
          return Promise.resolve(
            error ? { data: null, error } : { data: { id: "novo", slug: attemptedSlug }, error: null },
          );
        },
      };
      return chain;
    },
  }),
}));

import { createProduct } from "@/lib/products/actions";

function form() {
  const data = new FormData();
  for (const [k, v] of Object.entries({
    name: "Bolsa Florence",
    description: "",
    price: "100",
    materials: "",
    status: "available",
  })) {
    data.set(k, v);
  }
  return data;
}

async function submit() {
  try {
    return await createProduct({}, form());
  } catch {
    return { error: "redirect" }; // redirect() do Next lança em caso de sucesso
  }
}

describe("createProduct — nome repetido", () => {
  beforeEach(() => {
    state.sameStore = null;
    state.insertErrors = [];
    state.insertedSlugs = [];
  });

  it("avisa quando a MESMA loja já tem um produto com esse nome e não insere", async () => {
    state.sameStore = { id: "p1", archived_at: null };
    const result = await submit();

    expect(result).toMatchObject({ error: expect.stringMatching(/já tem um produto com esse nome/i) });
    expect(state.insertedSlugs).toHaveLength(0);
  });

  it("menciona quando o produto repetido está arquivado", async () => {
    state.sameStore = { id: "p1", archived_at: "2026-10-01T00:00:00Z" };
    const result = await submit();

    expect(result).toMatchObject({ error: expect.stringMatching(/arquivado/i) });
  });

  it("permite o mesmo nome quando só OUTRA conta o usa: colisão externa vira slug com sufixo", async () => {
    state.insertErrors = [{ code: "23505" }]; // primeira tentativa colide fora da loja
    const result = await submit();

    expect(result?.error).toBeUndefined();
    expect(state.insertedSlugs).toHaveLength(2);
    expect(state.insertedSlugs[0]).toBe("bolsa-florence");
    expect(state.insertedSlugs[1]).toMatch(/^bolsa-florence-[a-z0-9]{1,4}$/);
  });
});
