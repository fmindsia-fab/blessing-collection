import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    subscription: null as Record<string, unknown> | null,
    sessionParams: null as Record<string, unknown> | null,
    notOwner: null as string | null,
    redirected: null as string | null,
    createError: null as Error | null,
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    state.redirected = url;
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("@/lib/store/get-active-store", () => ({
  getActiveStore: async () => ({ id: "loja-1", name: "Maria Bolsas" }),
  getSiteUrl: async () => "https://maria.atelifacil.com.br",
}));
vi.mock("@/lib/store/ownership", () => ({
  getNotOwnerError: async () => state.notOwner,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1", email: "maria@loja.com" } } }) },
    from: () => {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: state.subscription, error: null }),
      };
      return chain;
    },
  }),
}));
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(async (params: Record<string, unknown>) => {
          if (state.createError) throw state.createError;
          state.sessionParams = params;
          return { url: "https://checkout.stripe.com/c/pay/cs_test_1" };
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(async () => ({ url: "https://billing.stripe.com/p/session/test_1" })),
      },
    },
    customers: { create: vi.fn(async () => { throw new Error("não deve criar Customer antes do Checkout"); }) },
  },
}));

import { startCheckout } from "@/lib/stripe/actions";

async function run() {
  try {
    await startCheckout();
  } catch {
    // redirect() do Next lança em caso de sucesso
  }
}

describe("startCheckout", () => {
  beforeEach(() => {
    state.subscription = { stripe_customer_id: null, stripe_subscription_id: null, status: "expired", trial_ends_at: null };
    state.sessionParams = null;
    state.notOwner = null;
    state.redirected = null;
    state.createError = null;
    process.env.STRIPE_PRICE_ID = "price_test_123";
  });

  it("primeira assinatura: não pré-cria Customer, usa o e-mail e liga o checkout à loja", async () => {
    await run();

    expect(state.sessionParams).toMatchObject({
      mode: "subscription",
      customer_email: "maria@loja.com",
      client_reference_id: "loja-1",
      locale: "pt-BR",
      line_items: [{ price: "price_test_123", quantity: 1 }],
      subscription_data: { metadata: { store_id: "loja-1" } },
    });
    expect(state.sessionParams).not.toHaveProperty("customer");
    expect(state.sessionParams).not.toHaveProperty("payment_method_types");
    expect(state.redirected).toBe("https://checkout.stripe.com/c/pay/cs_test_1");
  });

  it("quem já foi cliente reaproveita o Customer do Stripe", async () => {
    state.subscription = { stripe_customer_id: "cus_9", stripe_subscription_id: "sub_old", status: "canceled", trial_ends_at: null };
    await run();

    expect(state.sessionParams).toMatchObject({ customer: "cus_9" });
    expect(state.sessionParams).not.toHaveProperty("customer_email");
  });

  it("assinando dentro do teste grátis, preserva os dias restantes (trial_end) ", async () => {
    const ends = new Date(Date.now() + 10 * 86_400_000).toISOString();
    state.subscription = { stripe_customer_id: null, stripe_subscription_id: null, status: "trialing", trial_ends_at: ends };
    await run();

    const data = state.sessionParams?.subscription_data as { trial_end?: number };
    expect(data.trial_end).toBe(Math.floor(new Date(ends).getTime() / 1000));
  });

  it("conta que não é a dona não abre cobrança e volta com o aviso", async () => {
    state.notOwner = "outra conta";
    await run();

    expect(state.sessionParams).toBeNull();
    expect(state.redirected).toBe("/admin/configuracoes?checkout=outra-conta");
  });

  it("quem já tem assinatura viva no Stripe (ex.: pagamento em atraso) vai para o portal, nunca para um 2º checkout", async () => {
    for (const status of ["active", "past_due", "trialing"]) {
      state.sessionParams = null;
      state.redirected = null;
      state.subscription = {
        stripe_customer_id: "cus_9",
        stripe_subscription_id: "sub_vivo",
        status,
        trial_ends_at: null,
      };

      await run();

      expect(state.sessionParams, `status ${status}`).toBeNull();
      expect(state.redirected, `status ${status}`).toBe("https://billing.stripe.com/p/session/test_1");
    }
  });

  it("assinatura já encerrada no Stripe (cancelada) pode assinar de novo", async () => {
    state.subscription = {
      stripe_customer_id: "cus_9",
      stripe_subscription_id: "sub_morta",
      status: "canceled",
      trial_ends_at: null,
    };

    await run();

    expect(state.sessionParams).toMatchObject({ mode: "subscription", customer: "cus_9" });
  });

  it("erro do Stripe vira aviso claro na tela (e fica no log), sem estourar como erro de servidor", async () => {
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    state.createError = Object.assign(new Error("The provided key does not have the required permissions"), {
      type: "StripePermissionError",
      statusCode: 403,
    });

    await run();

    expect(state.redirected).toBe("/admin/configuracoes?checkout=erro");
    expect(logSpy).toHaveBeenCalledWith(
      "[startCheckout] falha ao criar a sessão de pagamento",
      expect.objectContaining({ storeId: "loja-1", type: "StripePermissionError", statusCode: 403 }),
    );
    logSpy.mockRestore();
  });
});
