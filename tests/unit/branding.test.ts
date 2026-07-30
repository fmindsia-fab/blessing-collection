import { afterAll, beforeAll, describe, expect, it } from "vitest";

// O mock de next/font/google é global — ver tests/setup.ts.
import { isValidHexColor, isSafeBrandFontUrl } from "@/lib/store/branding";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { FONT_CATALOG, DEFAULT_FONT, isCuratedFont } from "@/lib/store/font-catalog";

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

describe("catálogo de fontes", () => {
  it("resolve todas as fontes curadas", () => {
    for (const option of FONT_CATALOG) {
      expect(getBrandFontVariable(option.value)).toBeTruthy();
    }
  });

  it("oferece pelo menos 16 opções, divididas em serifadas e sem serifa", () => {
    expect(FONT_CATALOG.length).toBeGreaterThanOrEqual(16);
    expect(FONT_CATALOG.some((o) => o.group === "serif")).toBe(true);
    expect(FONT_CATALOG.some((o) => o.group === "sans")).toBe(true);
  });

  it("não tem valores duplicados", () => {
    const values = FONT_CATALOG.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("cai no padrão para fonte desconhecida em vez de quebrar", () => {
    expect(getBrandFontVariable("comic-sans")).toBe(getBrandFontVariable(DEFAULT_FONT));
  });

  it("isCuratedFont distingue valor conhecido de arbitrário", () => {
    expect(isCuratedFont("playfair-display")).toBe(true);
    expect(isCuratedFont("comic-sans")).toBe(false);
  });
});

describe("isSafeBrandFontUrl", () => {
  const SUPABASE = "https://abc123.supabase.co";
  const original = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });

  it("aceita .woff2 do bucket de fontes do próprio projeto", () => {
    expect(
      isSafeBrandFontUrl(`${SUPABASE}/storage/v1/object/public/brand-fonts/store-1/x.woff2`),
    ).toBe(true);
  });

  // A URL é interpolada num @font-face: host estranho ou extensão errada
  // viraria vetor de injeção de CSS.
  it("rejeita host de terceiro", () => {
    expect(isSafeBrandFontUrl("https://malicioso.com/brand-fonts/x.woff2")).toBe(false);
  });

  it("rejeita bucket diferente", () => {
    expect(
      isSafeBrandFontUrl(`${SUPABASE}/storage/v1/object/public/product-images/store-1/x.woff2`),
    ).toBe(false);
  });

  it("rejeita extensão diferente de .woff2", () => {
    expect(
      isSafeBrandFontUrl(`${SUPABASE}/storage/v1/object/public/brand-fonts/store-1/x.ttf`),
    ).toBe(false);
  });

  it("rejeita nulo, vazio e string malformada", () => {
    expect(isSafeBrandFontUrl(null)).toBe(false);
    expect(isSafeBrandFontUrl("")).toBe(false);
    expect(isSafeBrandFontUrl("nao-e-url')} body{display:none}")).toBe(false);
  });
});
