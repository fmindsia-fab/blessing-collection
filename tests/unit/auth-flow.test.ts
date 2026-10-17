import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { state } = vi.hoisted(() => ({
  state: {
    verifyOtpError: null as { message: string } | null,
    verifyOtpCalls: [] as { type: string; token_hash: string }[],
    resetError: null as { status?: number; message: string } | null,
    resetCalls: [] as { email: string; redirectTo: string | undefined }[],
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      verifyOtp: async (params: { type: string; token_hash: string }) => {
        state.verifyOtpCalls.push(params);
        return { error: state.verifyOtpError };
      },
      resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
        state.resetCalls.push({ email, redirectTo: options?.redirectTo });
        return { error: state.resetError };
      },
    },
  }),
}));

vi.mock("@/lib/store/get-active-store", () => ({
  getSiteUrl: async () => "https://loja.atelifacil.com.br",
}));

import { safeNextPath } from "@/lib/auth/safe-next";
import { GET } from "@/app/auth/confirm/route";
import { requestPasswordReset } from "@/lib/auth/actions";

function confirmRequest(query: string) {
  return new NextRequest(`https://atelifacil.com.br/auth/confirm?${query}`);
}

function formWith(email: string) {
  const fd = new FormData();
  fd.set("email", email);
  return fd;
}

beforeEach(() => {
  state.verifyOtpError = null;
  state.verifyOtpCalls = [];
  state.resetError = null;
  state.resetCalls = [];
});

describe("safeNextPath", () => {
  it("aceita só caminho relativo do próprio site", () => {
    expect(safeNextPath("/redefinir-senha")).toBe("/redefinir-senha");
    expect(safeNextPath("/cadastro/loja?x=1")).toBe("/cadastro/loja?x=1");
  });

  it("recusa endereço absoluto, protocol-relative e contrabarra (redirecionamento aberto)", () => {
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("", "/admin")).toBe("/admin");
  });
});

describe("GET /auth/confirm", () => {
  it("valida o token de recuperação e segue para a tela de nova senha", async () => {
    const res = await GET(confirmRequest("token_hash=abc&type=recovery&next=%2Fredefinir-senha"));

    expect(state.verifyOtpCalls).toEqual([{ type: "recovery", token_hash: "abc" }]);
    expect(res.headers.get("location")).toBe("https://atelifacil.com.br/redefinir-senha");
  });

  it("ignora um `next` malicioso e cai na home do próprio site", async () => {
    const res = await GET(confirmRequest("token_hash=abc&type=email&next=%2F%2Fevil.com"));

    expect(res.headers.get("location")).toBe("https://atelifacil.com.br/");
  });

  it("link expirado de recuperação volta para pedir outro", async () => {
    state.verifyOtpError = { message: "Token has expired or is invalid" };
    const res = await GET(confirmRequest("token_hash=abc&type=recovery&next=%2Fredefinir-senha"));

    expect(res.headers.get("location")).toBe("https://atelifacil.com.br/esqueci-senha?erro=link-invalido");
  });

  it("recusa tipos que o produto não usa, sem chamar o Supabase", async () => {
    const res = await GET(confirmRequest("token_hash=abc&type=invite"));

    expect(state.verifyOtpCalls).toHaveLength(0);
    expect(res.headers.get("location")).toBe("https://atelifacil.com.br/login?erro=link-invalido");
  });
});

describe("requestPasswordReset", () => {
  it("manda o link de volta para o host de onde saiu o pedido", async () => {
    const result = await requestPasswordReset({}, formWith("  Maria@Email.com "));

    expect(result).toEqual({ success: true });
    expect(state.resetCalls[0]).toEqual({
      email: "maria@email.com",
      redirectTo: "https://loja.atelifacil.com.br/auth/confirm?next=%2Fredefinir-senha",
    });
  });

  it("responde igual mesmo se o e-mail não tiver conta (não revela cadastro)", async () => {
    state.resetError = { status: 400, message: "User not found" };

    expect(await requestPasswordReset({}, formWith("naoexiste@email.com"))).toEqual({ success: true });
  });

  it("informa só a limitação de frequência e rejeita e-mail inválido", async () => {
    state.resetError = { status: 429, message: "rate limit" };
    expect(await requestPasswordReset({}, formWith("maria@email.com"))).toMatchObject({
      error: expect.stringMatching(/aguarde/i),
    });

    state.resetCalls = [];
    expect(await requestPasswordReset({}, formWith("isso-nao-e-email"))).toMatchObject({
      error: expect.stringMatching(/e-mail válido/i),
    });
    expect(state.resetCalls).toHaveLength(0);
  });
});
