import { describe, expect, it } from "vitest";
import {
  UNCATEGORIZED_LABEL,
  buildPrintPages,
  parsePerSheet,
  parsePrintAvailability,
  type PrintProduct,
} from "@/lib/catalog/print-sheet";

const categories = [
  { id: "bolsas", name: "Bolsas" },
  { id: "acessorios", name: "Acessórios" },
];

function product(id: string, categoryId: string | null, status: PrintProduct["status"] = "available"): PrintProduct {
  return { id, name: id, price: 100, status, fromPrice: false, coverUrl: null, categoryId };
}

describe("buildPrintPages", () => {
  const products = [
    product("b1", "bolsas"),
    product("b2", "bolsas", "made_to_order"),
    product("b3", "bolsas"),
    product("b4", "bolsas"),
    product("b5", "bolsas"),
    product("a1", "acessorios"),
    product("s1", null),
  ];

  it("separa por tipo, cada tipo numa folha nova, e põe as sem tipo por último", () => {
    const pages = buildPrintPages({ products, categories, availability: "todas", categoryIds: [], perSheet: 4 });

    expect(pages.map((p) => [p.categoryName, p.products.length])).toEqual([
      ["Bolsas", 4],
      ["Bolsas", 1],
      ["Acessórios", 1],
      [UNCATEGORIZED_LABEL, 1],
    ]);
  });

  it("filtra por disponibilidade", () => {
    const prontas = buildPrintPages({ products, categories, availability: "pronta-entrega", categoryIds: [], perSheet: 6 });
    const encomenda = buildPrintPages({ products, categories, availability: "sob-encomenda", categoryIds: [], perSheet: 6 });

    expect(prontas.flatMap((p) => p.products).every((p) => p.status === "available")).toBe(true);
    expect(encomenda.flatMap((p) => p.products.map((x) => x.id))).toEqual(["b2"]);
  });

  it("com tipos escolhidos, imprime só eles e deixa de fora as peças sem tipo", () => {
    const pages = buildPrintPages({ products, categories, availability: "todas", categoryIds: ["acessorios"], perSheet: 4 });

    expect(pages.map((p) => p.categoryName)).toEqual(["Acessórios"]);
  });

  it("divide em folhas do tamanho pedido e nunca cria folha vazia", () => {
    const seis = buildPrintPages({ products, categories, availability: "todas", categoryIds: ["bolsas"], perSheet: 6 });

    expect(seis.map((p) => p.products.length)).toEqual([5]);
    expect(buildPrintPages({ products: [], categories, availability: "todas", categoryIds: [], perSheet: 4 })).toEqual([]);
  });

  it("trata peça de tipo desconhecido como sem tipo", () => {
    const pages = buildPrintPages({
      products: [product("x", "apagada")],
      categories,
      availability: "todas",
      categoryIds: [],
      perSheet: 4,
    });

    expect(pages.map((p) => p.categoryName)).toEqual([UNCATEGORIZED_LABEL]);
  });
});

describe("parâmetros da URL", () => {
  it("aceitam só valores conhecidos", () => {
    expect(parsePrintAvailability("pronta-entrega")).toBe("pronta-entrega");
    expect(parsePrintAvailability("qualquer")).toBe("todas");
    expect(parsePerSheet("6")).toBe(6);
    expect(parsePerSheet("9")).toBe(4);
    expect(parsePerSheet(undefined)).toBe(4);
  });
});
