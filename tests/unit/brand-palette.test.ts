import { describe, expect, it } from "vitest";
import {
  MAX_BRAND_COLORS,
  normalizeHexInput,
  parseBrandColors,
  resolveBrandColors,
  DEFAULT_BRAND_COLORS,
} from "@/lib/store/branding";

describe("normalizeHexInput", () => {
  it("aceita colagem sem # (formato comum do Figma/Photoshop)", () => {
    expect(normalizeHexInput("c9a227")).toBe("#C9A227");
  });

  it("remove espaços e normaliza para maiúsculas", () => {
    expect(normalizeHexInput("  #c9a227  ")).toBe("#C9A227");
  });

  it("trunca em 6 dígitos (descarta canal alfa colado junto)", () => {
    expect(normalizeHexInput("#C9A227FF")).toBe("#C9A227");
  });

  it("descarta caracteres fora do alfabeto hex", () => {
    // 'z' e os parênteses somem; sobram apenas dígitos hex válidos.
    expect(normalizeHexInput("#C9zA2(2)7")).toBe("#C9A227");
  });

  // Entradas assim resultam em hex "válido" porém sem sentido — o campo é de
  // cor, não de conversão de formato. O que importa é nunca escapar do padrão
  // #RRGGBB, já que o valor vai direto para o style do layout público.
  it("nunca produz algo fora do formato #RRGGBB", () => {
    for (const input of ["rgb(201,162,39)", "javascript:alert(1)", "<script>", ""]) {
      expect(normalizeHexInput(input)).toMatch(/^#[0-9A-F]{0,6}$/);
    }
  });
});

describe("parseBrandColors", () => {
  it("aceita uma paleta válida", () => {
    const result = parseBrandColors("#1C1917,#FAF8F5,#C9A227");
    expect(result).toEqual({ colors: ["#1C1917", "#FAF8F5", "#C9A227"] });
  });

  it("rejeita paleta vazia", () => {
    expect(parseBrandColors("")).toHaveProperty("error");
  });

  it(`rejeita mais de ${MAX_BRAND_COLORS} cores`, () => {
    const tooMany = Array(MAX_BRAND_COLORS + 1).fill("#000000").join(",");
    expect(parseBrandColors(tooMany)).toHaveProperty("error");
  });

  it("rejeita cor fora do formato hex — o valor vai para o style do layout", () => {
    const result = parseBrandColors("#1C1917,vermelho");
    expect(result).toHaveProperty("error");
  });
});

describe("resolveBrandColors", () => {
  it("prefere brand_colors quando presente", () => {
    const colors = resolveBrandColors({ brand_colors: ["#111111", "#222222"] });
    expect(colors).toEqual(["#111111", "#222222"]);
  });

  it("cai nas 3 colunas antigas antes da migration 0009 ser aplicada", () => {
    const colors = resolveBrandColors({
      brand_colors: null,
      color_primary: "#101010",
      color_secondary: "#F0F0F0",
      color_accent: "#C9A227",
    });
    expect(colors).toEqual(["#101010", "#F0F0F0", "#C9A227"]);
  });

  it("usa o padrão quando não há nada válido", () => {
    expect(resolveBrandColors({ brand_colors: [] })).toEqual(DEFAULT_BRAND_COLORS);
  });

  it("descarta cores inválidas vindas do banco", () => {
    const colors = resolveBrandColors({ brand_colors: ["#111111", "javascript:alert(1)"] });
    expect(colors).toEqual(["#111111"]);
  });

  it(`nunca devolve mais que ${MAX_BRAND_COLORS} cores`, () => {
    const colors = resolveBrandColors({
      brand_colors: ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666"],
    });
    expect(colors).toHaveLength(MAX_BRAND_COLORS);
  });
});
