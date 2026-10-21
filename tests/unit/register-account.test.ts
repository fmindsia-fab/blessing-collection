import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    signUpResult: { data: { user: { id: "u1", identities: [{}] }, session: null }, error: null } as {
      data: { user: { id: string; identities: unknown[] } | null; session: object | null };
      error: { message: string; status?: number } | null;
    },
    signUpCalls: [] as { email: string; password: string; options: Record<string, unknown> }[],
    recorded: [] as string[],
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      signUp: async (params: { email: string; password: string; options: Record<string, unknown> }) => {
        state.signUpCalls.push(params);
        return state.signUpResult;
      },
    },
  }),
}));
vi.mock("@/lib/store/get-active-store", () => ({ getSiteUrl: async () => "https://atelifacil.com.br" }));
vi.mock("@/lib/legal/acceptance", () => ({
  recordLegalAcceptance: async (userId: string, source: string) => {
    state.recorded.push(`${userId}:${source}`);
    return { ok: true };
  },
}));

import { registerAccount } from "@/lib/auth/actions";

const valid = { email: "maria@loja.com", password: "senha-segura-1", acceptTerms: true };

describe("registerAccount", () => {
  beforeEach(() => {
    state.signUpResult = { data: { user: { id: "u1", identities: [{}] }, session: null }, error: null };
    state.signUpCalls = [];
    state.recorded = [];
  });

  it("sem o aceite marcado a conta nem é criada", async () => {
    const result = await registerAccount({ ...valid, acceptTerms: false });

    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/Termos de Uso/) });
    expect(state.signUpCalls).toHaveLength(0);
    expect(state.recorded).toEqual([]);
  });

  it("cria a conta, registra o aceite com o id do usuário e manda o link de confirmação para este host", async () => {
    const result = await registerAccount({ ...valid, captchaToken: "TOKEN" });

    expect(result).toEqual({ status: "ok", hasSession: false });
    expect(state.recorded).toEqual(["u1:signup"]);
    expect(state.signUpCalls[0].options).toMatchObject({
      captchaToken: "TOKEN",
      emailRedirectTo: "https://atelifacil.com.br/auth/confirm?next=%2Fcadastro%2Floja",
    });
  });

  it("com sessão imediata (confirmação desligada) avisa que pode seguir direto para a loja", async () => {
    state.signUpResult = { data: { user: { id: "u1", identities: [{}] }, session: {} }, error: null };

    expect(await registerAccount(valid)).toEqual({ status: "ok", hasSession: true });
  });

  it("e-mail já cadastrado (usuário sem identidades) não registra aceite em nome de outra pessoa", async () => {
    state.signUpResult = { data: { user: { id: "outra-pessoa", identities: [] }, session: null }, error: null };

    expect(await registerAccount(valid)).toEqual({ status: "email-exists" });
    expect(state.recorded).toEqual([]);
  });

  it("traduz 'already registered' e CAPTCHA recusado, sem registrar aceite", async () => {
    state.signUpResult = { data: { user: null, session: null }, error: { message: "User already registered" } };
    expect(await registerAccount(valid)).toEqual({ status: "email-exists" });

    state.signUpResult = { data: { user: null, session: null }, error: { message: "captcha protection: request disallowed" } };
    expect(await registerAccount(valid)).toMatchObject({ status: "error", message: expect.stringMatching(/CAPTCHA/) });

    expect(state.recorded).toEqual([]);
  });

  it("valida e-mail e senha antes de chamar o Supabase", async () => {
    expect(await registerAccount({ ...valid, email: "isso-nao-e-email" })).toMatchObject({ status: "error" });
    expect(await registerAccount({ ...valid, password: "curta" })).toMatchObject({ status: "error" });
    expect(state.signUpCalls).toHaveLength(0);
  });
});
