import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    user: null as { id: string; email: string | null } | null,
    store: null as { slug: string } | null,
    generateError: null as { message: string } | null,
    hashedToken: "TOKEN_ABC" as string | null,
    generateCalls: [] as { type: string; email: string }[],
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: state.store, error: null }),
      };
      return chain;
    },
  }),
}));

vi.mock("@/lib/platform/service-role-client", () => ({
  createPlatformServiceClient: () => ({
    auth: {
      admin: {
        generateLink: async (params: { type: string; email: string }) => {
          state.generateCalls.push(params);
          return {
            data: state.hashedToken ? { properties: { hashed_token: state.hashedToken } } : null,
            error: state.generateError,
          };
        },
      },
    },
  }),
}));

import { buildStoreHandoff } from "@/lib/auth/handoff";

describe("buildStoreHandoff", () => {
  beforeEach(() => {
    state.user = { id: "u1", email: "dona@loja.com" };
    state.store = { slug: "mariabolsas" };
    state.generateError = null;
    state.hashedToken = "TOKEN_ABC";
    state.generateCalls = [];
    process.env.PLATFORM_DOMAIN = "atelifacil.com.br";
  });

  it("gera o link de uso único só para o e-mail do usuário logado, com destino fixo /admin", async () => {
    const result = await buildStoreHandoff();

    expect(state.generateCalls).toEqual([{ type: "magiclink", email: "dona@loja.com" }]);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;

    const url = new URL(result.url);
    expect(url.origin).toBe("https://mariabolsas.atelifacil.com.br");
    expect(url.pathname).toBe("/auth/confirm");
    expect(url.searchParams.get("token_hash")).toBe("TOKEN_ABC");
    expect(url.searchParams.get("type")).toBe("magiclink");
    expect(url.searchParams.get("next")).toBe("/admin");
  });

  it("sem sessão ou sem loja, não gera nenhum link", async () => {
    state.user = null;
    expect((await buildStoreHandoff()).kind).toBe("no-session");

    state.user = { id: "u1", email: "dona@loja.com" };
    state.store = null;
    expect((await buildStoreHandoff()).kind).toBe("no-store");
    expect(state.generateCalls).toHaveLength(0);
  });

  it("se a geração do link falhar, cai no painel simples da loja (sem token)", async () => {
    state.generateError = { message: "falhou" };
    state.hashedToken = null;

    const result = await buildStoreHandoff();

    expect(result).toEqual({
      kind: "unavailable",
      fallbackUrl: "https://mariabolsas.atelifacil.com.br/admin",
    });
  });
});
