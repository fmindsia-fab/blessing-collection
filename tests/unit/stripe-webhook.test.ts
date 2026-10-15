import { describe, expect, it, vi, beforeEach } from "vitest";

const { state } = vi.hoisted(() => ({
  state: {
    event: null as { type: string; data: { object: unknown } } | null,
    verifyShouldThrow: false,
    upsertedSubscription: null as Record<string, unknown> | null,
    storesTouched: false,
    retrievedSubscriptionId: null as string | null,
    subscriptionToReturn: null as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    webhooks: {
      constructEventAsync: vi.fn(async () => {
        if (state.verifyShouldThrow) throw new Error("invalid signature");
        return state.event;
      }),
    },
    subscriptions: {
      retrieve: vi.fn(async (id: string) => {
        state.retrievedSubscriptionId = id;
        return state.subscriptionToReturn;
      }),
    },
  },
}));

vi.mock("@/app/api/webhooks/stripe/service-role-client", () => ({
  createWebhookSupabaseClient: () => ({
    from: (table: string) => {
      if (table === "store_subscriptions") {
        return {
          upsert: (payload: Record<string, unknown>) => {
            state.upsertedSubscription = payload;
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "stores") {
        // O webhook não pode escrever em stores: status da loja é
        // administrativo, separado da assinatura (migration 0032).
        state.storesTouched = true;
      }
      throw new Error(`tabela inesperada: ${table}`);
    },
  }),
}));

function makeRequest(body: string) {
  return {
    headers: { get: (key: string) => (key === "stripe-signature" ? "sig_test" : null) },
    text: async () => body,
  } as unknown as Parameters<typeof import("@/app/api/webhooks/stripe/route").POST>[0];
}

function makeSubscription(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    metadata: { store_id: "store-1" },
    items: { data: [{ price: { id: "price_123" }, current_period_end: 1700000000 }] },
    ...overrides,
  };
}

describe("webhook do Stripe", () => {
  beforeEach(() => {
    vi.resetModules();
    state.event = null;
    state.verifyShouldThrow = false;
    state.upsertedSubscription = null;
    state.storesTouched = false;
    state.retrievedSubscriptionId = null;
    state.subscriptionToReturn = null;
  });

  it("rejeita requisição sem assinatura válida (400)", async () => {
    state.verifyShouldThrow = true;
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
    expect(state.upsertedSubscription).toBeNull();
  });

  it("atualiza a mesma linha de store_subscriptions em customer.subscription.updated (active)", async () => {
    const subscription = makeSubscription({ status: "active" });
    state.event = { type: "customer.subscription.updated", data: { object: subscription } };

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(state.upsertedSubscription).toMatchObject({
      store_id: "store-1",
      stripe_subscription_id: "sub_123",
      status: "active",
      billing_type: "stripe",
    });
    expect(state.storesTouched).toBe(false);
  });

  it("marca a assinatura como canceled sem alterar stores.status", async () => {
    const subscription = makeSubscription({ status: "canceled" });
    state.event = { type: "customer.subscription.deleted", data: { object: subscription } };

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    await POST(makeRequest("{}"));

    expect(state.upsertedSubscription).toMatchObject({ status: "canceled" });
    expect(state.storesTouched).toBe(false);
  });

  it("marca a assinatura como past_due sem alterar stores.status", async () => {
    const subscription = makeSubscription({ status: "past_due" });
    state.event = { type: "customer.subscription.updated", data: { object: subscription } };

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    await POST(makeRequest("{}"));

    expect(state.upsertedSubscription).toMatchObject({ status: "past_due" });
    expect(state.storesTouched).toBe(false);
  });

  it("mapeia status fora do enum (incomplete) para past_due, sem descartar o evento", async () => {
    const subscription = makeSubscription({ status: "incomplete" });
    state.event = { type: "customer.subscription.updated", data: { object: subscription } };

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    await POST(makeRequest("{}"));

    expect(state.upsertedSubscription).toMatchObject({ status: "past_due" });
  });

  it("ignora subscription sem store_id em metadata, sem lançar erro", async () => {
    const subscription = makeSubscription({ metadata: {} });
    state.event = { type: "customer.subscription.updated", data: { object: subscription } };

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(state.upsertedSubscription).toBeNull();
  });

  it("checkout.session.completed busca a subscription completa antes de sincronizar", async () => {
    state.subscriptionToReturn = makeSubscription({ status: "active" });
    state.event = {
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", subscription: "sub_123" } },
    };

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    await POST(makeRequest("{}"));

    expect(state.retrievedSubscriptionId).toBe("sub_123");
    expect(state.upsertedSubscription).toMatchObject({ status: "active" });
  });

  it("ignora eventos não relevantes", async () => {
    state.event = { type: "customer.updated", data: { object: {} } };
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(state.upsertedSubscription).toBeNull();
  });
});
