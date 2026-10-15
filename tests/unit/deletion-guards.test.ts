import { describe, expect, it } from "vitest";
import { getDeletionBlocker } from "@/lib/platform/deletion-guards";

const base = { ownerIsCurrentUser: false, ownerIsPlatformAdmin: false, subscription: null };

describe("getDeletionBlocker", () => {
  it("libera conta de teste comum (trial ou sem assinatura)", () => {
    expect(getDeletionBlocker(base)).toBeNull();
    expect(
      getDeletionBlocker({
        ...base,
        subscription: { status: "trialing", billing_type: "manual", stripe_subscription_id: null },
      }),
    ).toBeNull();
  });

  it("bloqueia conta de administrador da plataforma, inclusive a própria", () => {
    expect(getDeletionBlocker({ ...base, ownerIsCurrentUser: true })).toMatch(/administrador/i);
    expect(getDeletionBlocker({ ...base, ownerIsPlatformAdmin: true })).toMatch(/administrador/i);
  });

  it("bloqueia cortesia e assinatura Stripe ativa, mas libera Stripe cancelada", () => {
    const sub = (over: object) => ({
      ...base,
      subscription: { status: "active", billing_type: "stripe", stripe_subscription_id: "sub_1", ...over },
    });

    expect(getDeletionBlocker(sub({ billing_type: "complimentary", stripe_subscription_id: null }))).toMatch(
      /cortesia/i,
    );
    expect(getDeletionBlocker(sub({}))).toMatch(/Stripe/);
    expect(getDeletionBlocker(sub({ status: "canceled" }))).toBeNull();
  });
});
