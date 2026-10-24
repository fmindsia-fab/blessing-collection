import { describe, expect, it } from "vitest";
import { calculateOrderTotal, calculateProductionList, mergeMaterialNeeds } from "@/lib/orders/calculate";

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

describe("mergeMaterialNeeds", () => {
  const receita = [{ name: "Fio", unit: "g", quantity: 400, materialId: "fio" }];

  it("soma os materiais das variações escolhidas (ex.: a alça) à receita da peça", () => {
    const lista = mergeMaterialNeeds(receita, [
      { materialId: "alca-metal", name: "Alça Metal", unit: "Un", quantity: 2 },
    ]);

    expect(lista.map((l) => [l.name, l.quantity])).toEqual([
      ["Alça Metal", 2],
      ["Fio", 400],
    ]);
  });

  it("junta o mesmo material da receita e da variação numa linha só", () => {
    const lista = mergeMaterialNeeds(receita, [{ materialId: "fio", name: "Fio", unit: "g", quantity: 50 }]);

    expect(lista).toEqual([{ name: "Fio", unit: "g", quantity: 450, materialId: "fio" }]);
  });

  it("sem variações com material, a lista fica igual à receita", () => {
    expect(mergeMaterialNeeds(receita, [])).toEqual(receita);
  });

  it("ignora quantidade zero", () => {
    expect(mergeMaterialNeeds([], [{ materialId: "x", name: "X", unit: "un", quantity: 0 }])).toEqual([]);
  });
});

