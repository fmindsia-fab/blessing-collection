import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: { user: null as { id: string; email: string } | null, throws: false },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => {
    if (state.throws) throw new Error("sem sessão");
    return { auth: { getUser: async () => ({ data: { user: state.user } }) } };
  },
}));

import { getNotOwnerError, getStoreOwnership, NOT_OWNER_MESSAGE } from "@/lib/store/ownership";

describe("propriedade da loja", () => {
  beforeEach(() => {
    state.user = null;
    state.throws = false;
  });

  it("devolve a mensagem clara quando a conta logada não é a dona", async () => {
    state.user = { id: "admin-1", email: "admin@x.com" };
    expect(await getNotOwnerError({ owner_user_id: "dono-1" })).toBe(NOT_OWNER_MESSAGE);
    expect(await getStoreOwnership({ owner_user_id: "dono-1" })).toMatchObject({
      known: true,
      isOwner: false,
      userEmail: "admin@x.com",
    });
  });

  it("não devolve erro para a dona da loja", async () => {
    state.user = { id: "dono-1", email: "dono@x.com" };
    expect(await getNotOwnerError({ owner_user_id: "dono-1" })).toBeNull();
  });

  it("não inventa erro quando não dá para saber (sem sessão, falha ou sem owner)", async () => {
    expect(await getNotOwnerError({ owner_user_id: "dono-1" })).toBeNull();
    state.throws = true;
    expect(await getNotOwnerError({ owner_user_id: "dono-1" })).toBeNull();
    expect(await getNotOwnerError({})).toBeNull();
  });
});
