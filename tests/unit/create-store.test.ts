import { describe, expect, it, vi, beforeEach } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    user: { id: "user-1" } as { id: string } | null,
    insertError: null as { code: string } | null,
    insertedSlug: null as string | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    rpc: async () => ({ data: true, error: null }),
    from: () => ({
      insert: (payload: { slug: string }) => {
        state.insertedSlug = payload.slug;
        return {
          select: () => ({
            single: async () =>
              state.insertError
                ? { data: null, error: state.insertError }
                : { data: { slug: payload.slug }, error: null },
          }),
        };
      },
    }),
  }),
}));

function formDataFrom(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createStore", () => {
  beforeEach(() => {
    state.user = { id: "user-1" };
    state.insertError = null;
    state.insertedSlug = null;
  });

  it("cria a loja com owner_user_id vindo da sessão, não do formulário", async () => {
    const { createStore } = await import("@/lib/onboarding/actions");
    const result = await createStore(
      {},
      formDataFrom({ name: "Maria Bolsas", slug: "mariabolsas", whatsappNumber: "11999999999" }),
    );

    expect(result.success).toBe(true);
    expect(result.storeSlug).toBe("mariabolsas");
    expect(state.insertedSlug).toBe("mariabolsas");
  });

  it("recusa sem sessão autenticada", async () => {
    state.user = null;
    const { createStore } = await import("@/lib/onboarding/actions");
    const result = await createStore(
      {},
      formDataFrom({ name: "Maria Bolsas", slug: "mariabolsas", whatsappNumber: "11999999999" }),
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/sessão/i);
  });

  it("rejeita slug inválido antes de tentar o insert", async () => {
    const { createStore } = await import("@/lib/onboarding/actions");
    const result = await createStore(
      {},
      formDataFrom({ name: "Maria Bolsas", slug: "ad", whatsappNumber: "11999999999" }),
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toBeTruthy();
    expect(state.insertedSlug).toBeNull();
  });

  it("traduz unique_violation (23505) em mensagem amigável de slug em uso", async () => {
    state.insertError = { code: "23505" };
    const { createStore } = await import("@/lib/onboarding/actions");
    const result = await createStore(
      {},
      formDataFrom({ name: "Maria Bolsas", slug: "mariabolsas", whatsappNumber: "11999999999" }),
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/já está em uso/i);
  });
});
