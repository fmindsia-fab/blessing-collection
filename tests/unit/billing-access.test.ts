import { describe, expect, it } from "vitest";
import { hasSubscriptionAccess } from "@/lib/billing/access";
import { billingState } from "@/lib/platform/metrics";

const NOW = new Date("2026-10-15T12:00:00Z");
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe("hasSubscriptionAccess", () => {
  it("libera assinatura ativa, trial vigente e cortesia", () => {
    expect(hasSubscriptionAccess({ status: "active", trial_ends_at: null }, NOW)).toBe(true);
    expect(hasSubscriptionAccess({ status: "trialing", trial_ends_at: inDays(1) }, NOW)).toBe(true);
    expect(
      hasSubscriptionAccess({ status: "canceled", billing_type: "complimentary", trial_ends_at: null }, NOW),
    ).toBe(true);
  });

  it("bloqueia trial vencido (mesmo antes do job marcar expired), expired, past_due e sem assinatura", () => {
    expect(hasSubscriptionAccess({ status: "trialing", trial_ends_at: inDays(-1) }, NOW)).toBe(false);
    expect(hasSubscriptionAccess({ status: "trialing", trial_ends_at: null }, NOW)).toBe(false);
    expect(hasSubscriptionAccess({ status: "expired", trial_ends_at: inDays(-5) }, NOW)).toBe(false);
    expect(hasSubscriptionAccess({ status: "past_due", trial_ends_at: null }, NOW)).toBe(false);
    expect(hasSubscriptionAccess(null, NOW)).toBe(false);
  });
});

describe("billingState (painel da plataforma)", () => {
  it("classifica cortesia e expired", () => {
    const base = { current_period_end: null, trial_ends_at: null };
    expect(billingState({ ...base, status: "active", billing_type: "complimentary" }, NOW)).toBe("complimentary");
    expect(billingState({ ...base, status: "expired" }, NOW)).toBe("trial_expired");
  });
});

describe("hasSubscriptionAccess — carência de pagamento (past_due)", () => {
  const pastDue = (periodEndDaysAgo: number) => ({
    status: "past_due",
    trial_ends_at: null,
    current_period_end: inDays(-periodEndDaysAgo),
  });

  it("mantém o acesso por 7 dias depois do fim do período pago", () => {
    expect(hasSubscriptionAccess(pastDue(1), NOW)).toBe(true);
    expect(hasSubscriptionAccess(pastDue(6), NOW)).toBe(true);
  });

  it("derruba o acesso depois da carência ou sem data de período", () => {
    expect(hasSubscriptionAccess(pastDue(8), NOW)).toBe(false);
    expect(hasSubscriptionAccess({ status: "past_due", trial_ends_at: null }, NOW)).toBe(false);
  });
});
