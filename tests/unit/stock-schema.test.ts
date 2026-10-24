import { describe, expect, it } from "vitest";
import { adjustStockSchema, purchaseSchema } from "@/lib/stock/schema";

const MATERIAL_ID = "3f2c1c8e-7a52-4a4a-9f34-0b8e2d9a6c11";

const validPurchase = {
  purchasedAt: "2026-10-24",
  supplier: "Armarinho Central",
  freight: "5,00".replace(",", "."),
  notes: "nota 1234",
  items: [{ materialId: MATERIAL_ID, quantity: "1000", totalCost: "90", updateCost: true }],
};

describe("purchaseSchema", () => {
  it("aceita uma compra completa e converte os números", () => {
    const result = purchaseSchema.safeParse(validPurchase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].quantity).toBe(1000);
      expect(result.data.items[0].totalCost).toBe(90);
      expect(result.data.freight).toBe(5);
    }
  });

  it("recusa compra sem itens e quantidade zero ou negativa", () => {
    expect(purchaseSchema.safeParse({ ...validPurchase, items: [] }).success).toBe(false);
    expect(
      purchaseSchema.safeParse({ ...validPurchase, items: [{ ...validPurchase.items[0], quantity: "0" }] }).success,
    ).toBe(false);
    expect(
      purchaseSchema.safeParse({ ...validPurchase, items: [{ ...validPurchase.items[0], quantity: "-5" }] }).success,
    ).toBe(false);
  });

  it("recusa valor pago negativo, data fora do formato e material que não é um id", () => {
    expect(
      purchaseSchema.safeParse({ ...validPurchase, items: [{ ...validPurchase.items[0], totalCost: "-1" }] }).success,
    ).toBe(false);
    expect(purchaseSchema.safeParse({ ...validPurchase, purchasedAt: "24/10/2026" }).success).toBe(false);
    expect(
      purchaseSchema.safeParse({ ...validPurchase, items: [{ ...validPurchase.items[0], materialId: "abc" }] }).success,
    ).toBe(false);
  });

  it("limita o tamanho dos textos", () => {
    expect(purchaseSchema.safeParse({ ...validPurchase, supplier: "x".repeat(81) }).success).toBe(false);
    expect(purchaseSchema.safeParse({ ...validPurchase, notes: "x".repeat(501) }).success).toBe(false);
  });
});

describe("adjustStockSchema", () => {
  it("aceita zero (acabou) e recusa quantidade negativa", () => {
    expect(adjustStockSchema.safeParse({ materialId: MATERIAL_ID, quantity: "0" }).success).toBe(true);
    expect(adjustStockSchema.safeParse({ materialId: MATERIAL_ID, quantity: "-1" }).success).toBe(false);
  });
});
