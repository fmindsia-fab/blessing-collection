import { afterEach, describe, expect, it } from "vitest";
import { cleanEnv, getStripePriceId } from "@/lib/stripe/env";

const original = process.env.STRIPE_PRICE_ID;

afterEach(() => {
  process.env.STRIPE_PRICE_ID = original;
});

describe("valores de ambiente do Stripe", () => {
  it("tira espaço e quebra de linha colados junto com o valor (a causa do erro em produção)", () => {
    expect(cleanEnv("price_1URdaWBG8lL2Q35JjD4wsBKH\n")).toBe("price_1URdaWBG8lL2Q35JjD4wsBKH");
    expect(cleanEnv("  rk_live_abc\r\n")).toBe("rk_live_abc");
    expect(cleanEnv(undefined)).toBe("");

    process.env.STRIPE_PRICE_ID = "price_1URdaWBG8lL2Q35JjD4wsBKH\n";
    expect(getStripePriceId()).toBe("price_1URdaWBG8lL2Q35JjD4wsBKH");
  });

  it("rejeita ID ausente ou com formato inválido, em vez de mandá-lo ao Stripe", () => {
    process.env.STRIPE_PRICE_ID = "";
    expect(getStripePriceId()).toBeNull();

    process.env.STRIPE_PRICE_ID = "prod_123";
    expect(getStripePriceId()).toBeNull();

    process.env.STRIPE_PRICE_ID = "price_abc/../../customers";
    expect(getStripePriceId()).toBeNull();
  });
});
