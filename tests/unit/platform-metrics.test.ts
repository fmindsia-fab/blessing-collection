import { describe, expect, it } from "vitest";
import { billingState, computePlatformMetrics, daysUntil } from "@/lib/platform/metrics";

const NOW = new Date("2026-10-15T12:00:00Z");
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe("billingState", () => {
  it("trialing com data futura é teste; com data vencida é teste expirado", () => {
    const base = { current_period_end: null };
    expect(billingState({ ...base, status: "trialing", trial_ends_at: inDays(5) }, NOW)).toBe("trial");
    expect(billingState({ ...base, status: "trialing", trial_ends_at: inDays(-1) }, NOW)).toBe("trial_expired");
  });

  it("agrupa past_due e unpaid como inadimplente", () => {
    const sub = (status: string) => ({ status, current_period_end: null, trial_ends_at: null });
    expect(billingState(sub("past_due"), NOW)).toBe("past_due");
    expect(billingState(sub("past_due"), NOW)).toBe("past_due");
    expect(billingState(null, NOW)).toBe("none");
  });
});

describe("computePlatformMetrics", () => {
  it("conta lojas por situação de assinatura e status operacional", () => {
    const sub = (status: string, trialEnds: string | null = null) => ({
      status,
      current_period_end: null,
      trial_ends_at: trialEnds,
    });
    const metrics = computePlatformMetrics(
      [
        { status: "active", created_at: inDays(-3), subscription: sub("trialing", inDays(3)) },
        { status: "active", created_at: inDays(-20), subscription: sub("trialing", inDays(20)) },
        { status: "suspended", created_at: inDays(-60), subscription: sub("trialing", inDays(-5)) },
        { status: "active", created_at: inDays(-90), subscription: sub("active") },
      ],
      NOW,
    );

    expect(metrics).toMatchObject({
      totalStores: 4,
      activeStores: 3,
      suspendedStores: 1,
      newLast30Days: 2,
      trial: 2,
      trialExpiringSoon: 1,
      trialExpired: 1,
      paid: 1,
    });
    expect(daysUntil(inDays(3), NOW)).toBe(3);
  });
});
