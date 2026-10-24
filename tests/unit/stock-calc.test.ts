import { describe, expect, it } from "vitest";
import {
  calculateToBuy,
  costChangePercent,
  quantityFromPackages,
  stockLevel,
  summarizeCosts,
  summarizeOrderCost,
  unitCostFromPurchase,
} from "@/lib/stock/calc";

describe("unitCostFromPurchase / quantityFromPackages", () => {
  it("divide o valor pago pela quantidade", () => {
    expect(unitCostFromPurchase(18, 200)).toBeCloseTo(0.09, 6);
    expect(unitCostFromPurchase(10, 0)).toBe(0);
    expect(unitCostFromPurchase(10, -3)).toBe(0);
  });

  it("calcula a quantidade a partir das embalagens, sem erro de ponto flutuante", () => {
    expect(quantityFromPackages(5, 200)).toBe(1000);
    expect(quantityFromPackages(3, 0.1)).toBe(0.3);
    expect(quantityFromPackages(0, 200)).toBe(0);
  });
});

describe("stockLevel", () => {
  it("material sem controle não gera alerta", () => {
    expect(stockLevel(0, 100, false)).toBe("untracked");
  });

  it("classifica saldo negativo, zerado, baixo e normal", () => {
    expect(stockLevel(-20, 100, true)).toBe("negative");
    expect(stockLevel(0, 100, true)).toBe("empty");
    expect(stockLevel(100, 100, true)).toBe("low");
    expect(stockLevel(80, 100, true)).toBe("low");
    expect(stockLevel(101, 100, true)).toBe("ok");
  });

  it("sem estoque mínimo definido nunca fica 'acabando'", () => {
    expect(stockLevel(1, null, true)).toBe("ok");
    expect(stockLevel(1, 0, true)).toBe("ok");
  });
});

describe("summarizeCosts", () => {
  it("devolve vazio sem compras", () => {
    expect(summarizeCosts([]).lastUnitCost).toBeNull();
  });

  it("acha o último (pela data), o médio ponderado, o menor e o maior preço", () => {
    const summary = summarizeCosts([
      { date: "2026-10-20", quantity: 100, totalCost: 12 }, // 0,12
      { date: "2026-09-01", quantity: 300, totalCost: 24 }, // 0,08
      { date: "2026-10-01", quantity: 100, totalCost: 10 }, // 0,10
    ]);

    expect(summary.lastUnitCost).toBeCloseTo(0.12, 6);
    expect(summary.lowestUnitCost).toBeCloseTo(0.08, 6);
    expect(summary.highestUnitCost).toBeCloseTo(0.12, 6);
    // (12 + 24 + 10) / (100 + 300 + 100) = 0,092
    expect(summary.averageUnitCost).toBeCloseTo(0.092, 6);
  });
});

describe("costChangePercent", () => {
  it("compara o preço pago com o custo cadastrado", () => {
    expect(costChangePercent(0.1, 0.12)).toBe(20);
    expect(costChangePercent(0.1, 0.08)).toBe(-20);
    expect(costChangePercent(0, 0.12)).toBeNull();
  });
});

describe("summarizeOrderCost", () => {
  it("soma baixas e devoluções por material, com o custo do dia de cada movimento", () => {
    const summary = summarizeOrderCost(
      [
        { materialId: "fio", materialName: "Fio", unit: "g", quantity: -400, unitCost: 0.1 }, // 40,00
        { materialId: "fecho", materialName: "Fecho", unit: "un", quantity: -2, unitCost: 5 }, // 10,00
        { materialId: "fio", materialName: "Fio", unit: "g", quantity: 100, unitCost: 0.1 }, // devolveu 100 g
      ],
      200,
    );

    expect(summary.lines).toEqual([
      { materialId: "fecho", name: "Fecho", unit: "un", used: 2, cost: 10 },
      { materialId: "fio", name: "Fio", unit: "g", used: 300, cost: 30 },
    ]);
    expect(summary.totalCost).toBe(40);
    expect(summary.margin).toBe(160);
    expect(summary.marginPercent).toBe(80);
  });

  it("devolução total zera a linha e o custo", () => {
    const summary = summarizeOrderCost(
      [
        { materialId: "fio", materialName: "Fio", unit: "g", quantity: -400, unitCost: 0.1 },
        { materialId: "fio", materialName: "Fio", unit: "g", quantity: 400, unitCost: 0.1 },
      ],
      100,
    );
    expect(summary.lines).toEqual([]);
    expect(summary.totalCost).toBe(0);
  });

  it("pedido sem valor não calcula percentual", () => {
    expect(summarizeOrderCost([], 0).marginPercent).toBeNull();
  });
});

describe("calculateToBuy", () => {
  it("desconta o que já há em estoque", () => {
    expect(calculateToBuy(500, 200)).toEqual({ stock: 200, toBuy: 300 });
    expect(calculateToBuy(500, 800)).toEqual({ stock: 800, toBuy: 0 });
  });

  it("material sem controle: precisa comprar tudo; saldo negativo não ajuda", () => {
    expect(calculateToBuy(500, null)).toEqual({ stock: null, toBuy: 500 });
    expect(calculateToBuy(500, -50)).toEqual({ stock: -50, toBuy: 500 });
  });
});
