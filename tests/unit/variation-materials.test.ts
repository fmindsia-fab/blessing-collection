import { describe, expect, it } from "vitest";
import { findMaterialsForVariation, priceWithMaterial, type CatalogMaterial } from "@/lib/products/variation-materials";

const material = (id: string, name: string, unit_cost = 10): CatalogMaterial => ({ id, name, unit: "un", unit_cost });

const MATERIALS = [
  material("1", "Alça Tiracolo de Couro c/ Corrente", 84.5),
  material("2", "Alças de bambu"),
  material("3", "Fio poliéster"),
  material("4", "Calça de brim"),
  material("5", "Corrente dourada"),
  material("6", "Tiracolo alca longa"),
];

describe("findMaterialsForVariation", () => {
  it("acha os materiais que têm a variação no nome, sem ligar para acento e maiúscula", () => {
    const ids = findMaterialsForVariation("Alça", MATERIALS).map((m) => m.id);
    expect(ids).toEqual(["1", "2", "6"]);
    expect(findMaterialsForVariation("ALCA", MATERIALS).map((m) => m.id)).toEqual(["1", "2", "6"]);
  });

  it("não acha por pedaço no meio da palavra (Calça não é Alça)", () => {
    expect(findMaterialsForVariation("Alça", MATERIALS).some((m) => m.id === "4")).toBe(false);
  });

  it("variação curta demais não busca nada (Cor não pode achar Corrente)", () => {
    expect(findMaterialsForVariation("Cor", MATERIALS)).toEqual([]);
    expect(findMaterialsForVariation("", MATERIALS)).toEqual([]);
  });

  it("não quebra com caracteres especiais", () => {
    expect(findMaterialsForVariation("(alça", MATERIALS).length).toBeGreaterThan(0);
    expect(findMaterialsForVariation("a.*+?", MATERIALS)).toEqual([]);
  });
});

describe("priceWithMaterial", () => {
  it("soma o preço do material ao preço da peça com duas casas", () => {
    expect(priceWithMaterial(400, 84.5)).toBe(484.5);
    expect(priceWithMaterial(0.1, 0.2)).toBe(0.3);
    expect(priceWithMaterial(119.9, 0)).toBe(119.9);
  });
});
