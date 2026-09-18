import { describe, expect, it } from "vitest";
import { calculateOrderTotal, calculateProductionList } from "@/lib/orders/calculate";

describe("calculateOrderTotal", () => {
  it("soma quantidade × preço unitário de cada item", () => {
    const total = calculateOrderTotal([
      { quantity: 2, unitPrice: 150 },
      { quantity: 1, unitPrice: 89.9 },
    ]);
    expect(total).toBe(389.9);
  });

  it("retorna 0 para pedido sem itens", () => {
    expect(calculateOrderTotal([])).toBe(0);
  });
});

describe("calculateProductionList", () => {
  it("multiplica cada material pela quantidade encomendada da peça", () => {
    const quantities = new Map([["prod-1", 3]]);
    const materials = [
      { productId: "prod-1", name: "Fio poliéster", unit: "m", quantityPerUnit: 2 },
    ];

    const result = calculateProductionList(quantities, materials);

    expect(result).toEqual([{ name: "Fio poliéster", unit: "m", quantity: 6 }]);
  });

  it("soma o mesmo material usado em peças diferentes do pedido", () => {
    const quantities = new Map([
      ["prod-1", 2],
      ["prod-2", 1],
    ]);
    const materials = [
      { productId: "prod-1", name: "Etiqueta", unit: "un", quantityPerUnit: 1 },
      { productId: "prod-2", name: "Etiqueta", unit: "un", quantityPerUnit: 1 },
    ];

    const result = calculateProductionList(quantities, materials);

    expect(result).toEqual([{ name: "Etiqueta", unit: "un", quantity: 3 }]);
  });

  it("ignora material de produto que não está no pedido", () => {
    const quantities = new Map([["prod-1", 1]]);
    const materials = [
      { productId: "prod-1", name: "Forro", unit: "cm", quantityPerUnit: 40 },
      { productId: "prod-outro", name: "Alça", unit: "un", quantityPerUnit: 2 },
    ];

    const result = calculateProductionList(quantities, materials);

    expect(result).toEqual([{ name: "Forro", unit: "cm", quantity: 40 }]);
  });

  it("ordena o resultado por nome", () => {
    const quantities = new Map([["prod-1", 1]]);
    const materials = [
      { productId: "prod-1", name: "Zíper", unit: "un", quantityPerUnit: 1 },
      { productId: "prod-1", name: "Alça", unit: "un", quantityPerUnit: 1 },
    ];

    const result = calculateProductionList(quantities, materials);

    expect(result.map((m) => m.name)).toEqual(["Alça", "Zíper"]);
  });
});
