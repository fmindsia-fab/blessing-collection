import { describe, expect, it, vi, beforeEach } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    user: { id: "user-1" } as { id: string } | null,
    insertError: null as { code: string } | null,
    insertedSlug: null as string | null,
    profile: null as { id: string; full_name: string; cpf: string } | null,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    rpc: async () => ({ data: true, error: null }),
    from: (table: string) => ({
      upsert: async (payload: { id: string; full_name: string; cpf: string }) => {
        if (table === "profiles") state.profile = payload;
        return { error: null };
      },
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

const OWNER = { ownerName: "Maria da Silva", ownerCpf: "529.982.247-25" };

describe("createStore", () => {
  beforeEach(() => {
    state.user = { id: "user-1" };
    state.insertError = null;
    state.insertedSlug = null;
    state.profile = null;
  });

  it("cria a loja com owner_user_id vindo da sessão, não do formulário", async () => {
    const { createStore } = await import("@/lib/onboarding/actions");
    const result = await createStore(
      {},
      formDataFrom({ ...OWNER, name: "Maria Bolsas", slug: "mariabolsas", whatsappNumber: "11999999999" }),
    );

    expect(result.success).toBe(true);
    expect(result.storeSlug).toBe("mariabolsas");
    expect(state.insertedSlug).toBe("mariabolsas");
    expect(state.profile).toEqual({ id: "user-1", full_name: "Maria da Silva", cpf: "52998224725" });
  });

  it("recusa sem sessão autenticada", async () => {
    state.user = null;
    const { createStore } = await import("@/lib/onboarding/actions");
    const result = await createStore(
      {},
      formDataFrom({ ...OWNER, name: "Maria Bolsas", slug: "mariabolsas", whatsappNumber: "11999999999" }),
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/sessão/i);
  });

  it("rejeita slug inválido antes de tentar o insert", async () => {
    const { createStore } = await import("@/lib/onboarding/actions");
    const result = await createStore(
      {},
      formDataFrom({ ...OWNER, name: "Maria Bolsas", slug: "ad", whatsappNumber: "11999999999" }),
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
      formDataFrom({ ...OWNER, name: "Maria Bolsas", slug: "mariabolsas", whatsappNumber: "11999999999" }),
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/já está em uso/i);
  });
});
