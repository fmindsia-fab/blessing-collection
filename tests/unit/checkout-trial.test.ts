import { describe, expect, it } from "vitest";
import { computeCheckoutTrialEnd } from "@/lib/stripe/trial";

const NOW = new Date("2026-10-17T12:00:00Z");
const inHours = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();
const own = (trialEndsAt: string | null) => ({
  status: "trialing",
  stripe_subscription_id: null,
  trial_ends_at: trialEndsAt,
});

describe("computeCheckoutTrialEnd", () => {
  it("preserva os dias restantes do teste próprio (em segundos Unix)", () => {
    const end = inHours(10 * 24);
    expect(computeCheckoutTrialEnd(own(end), NOW)).toBe(Math.floor(new Date(end).getTime() / 1000));
  });

  it("com menos de 50 h de teste (o Stripe exige 48 h) cobra na hora", () => {
    expect(computeCheckoutTrialEnd(own(inHours(49)), NOW)).toBeUndefined();
    expect(computeCheckoutTrialEnd(own(inHours(51)), NOW)).toBeDefined();
  });

  it("nunca dá teste de novo: expirada, cancelada, já passou pelo Stripe ou sem data", () => {
    expect(computeCheckoutTrialEnd({ ...own(inHours(240)), status: "expired" }, NOW)).toBeUndefined();
    expect(computeCheckoutTrialEnd({ ...own(inHours(240)), status: "canceled" }, NOW)).toBeUndefined();
    expect(computeCheckoutTrialEnd({ ...own(inHours(240)), stripe_subscription_id: "sub_1" }, NOW)).toBeUndefined();
    expect(computeCheckoutTrialEnd(own(null), NOW)).toBeUndefined();
    expect(computeCheckoutTrialEnd(null, NOW)).toBeUndefined();
  });
});
