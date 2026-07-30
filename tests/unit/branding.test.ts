import { describe, expect, it, vi } from "vitest";

// next/font/google só é executável sob o compilador do Next; no vitest o
// módulo é substituído por loaders que devolvem a mesma forma ({ variable }).
vi.mock("next/font/google", () => {
  const loader = (name: string) => () => ({ variable: `--font-${name}` });
  return {
    Playfair_Display: loader("playfair"),
    Cormorant_Garamond: loader("cormorant"),
    Lora: loader("lora"),
    Montserrat: loader("montserrat"),
    Inter: loader("inter"),
  };
});

import { isValidHexColor, FONT_VALUES, FONT_OPTIONS } from "@/lib/store/branding";
import { getBrandFontVariable } from "@/lib/store/fonts";

describe("isValidHexColor", () => {
  it("aceita hex de 6 dígitos com #", () => {
    expect(isValidHexColor("#C9A227")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#ffffff")).toBe(true);
  });

  it("rejeita formatos que não vão para o style do layout público", () => {
    expect(isValidHexColor("C9A227")).toBe(false); // sem #
    expect(isValidHexColor("#FFF")).toBe(false); // forma curta
    expect(isValidHexColor("red")).toBe(false); // nome de cor
    expect(isValidHexColor("")).toBe(false);
    // Tentativa de injetar CSS pela coluna de cor.
    expect(isValidHexColor("#000; background: url(x)")).toBe(false);
  });
});

describe("getBrandFontVariable", () => {
  it("resolve as 5 fontes do catálogo", () => {
    for (const font of FONT_VALUES) {
      expect(getBrandFontVariable(font)).toBeTruthy();
    }
  });

  it("cai no padrão para fonte desconhecida em vez de quebrar", () => {
    expect(getBrandFontVariable("comic-sans")).toBe(getBrandFontVariable("playfair-display"));
  });
});

describe("FONT_OPTIONS", () => {
  it("cobre exatamente os valores aceitos pelo check constraint da migration 0001", () => {
    expect(FONT_OPTIONS.map((o) => o.value).sort()).toEqual(
      ["cormorant-garamond", "inter", "lora", "montserrat", "playfair-display"].sort(),
    );
  });
});
