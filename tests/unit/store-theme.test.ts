import { describe, expect, it } from "vitest";
import { buildStoreTheme, isDarkEnoughForText, isLight } from "@/lib/store/theme";

type Theme = Record<string, string>;

describe("buildStoreTheme", () => {
  it("expõe cada cor da paleta como --brand-N", () => {
    const theme = buildStoreTheme({ brand_colors: ["#1C1917", "#FAF8F5", "#C9A227"] }) as Theme;

    expect(theme["--brand-1"]).toBe("#1C1917");
    expect(theme["--brand-2"]).toBe("#FAF8F5");
    expect(theme["--brand-3"]).toBe("#C9A227");
  });

  it("usa a cor de destaque como acento quando ela tem presença", () => {
    const theme = buildStoreTheme({ brand_colors: ["#1C1917", "#FAF8F5", "#C9A227"] }) as Theme;
    expect(theme["--gold"]).toBe("#C9A227");
  });

  // Paleta real do usuário: verde-sálvia, lilás, areia, creme, lavanda.
  // A 3ª cor (#D7D4CF) é quase branca — usá-la como acento deixaria fios e
  // focos invisíveis, então o acento deve cair na cor com mais presença.
  it("descarta destaque claro demais e escolhe a cor com mais presença", () => {
    const theme = buildStoreTheme({
      brand_colors: ["#92AC95", "#9691B3", "#D7D4CF", "#F8F4EB", "#C4B3D8"],
    }) as Theme;

    expect(theme["--gold"]).not.toBe("#D7D4CF");
    expect(["#92AC95", "#9691B3"]).toContain(theme["--gold"]);
  });

  it("não usa cor clara como texto — manteria o catálogo ilegível", () => {
    const theme = buildStoreTheme({
      brand_colors: ["#D7D4CF", "#FFFFFF", "#C4B3D8"],
    }) as Theme;

    expect(theme["--foreground"]).toBeUndefined();
  });

  it("usa a primária como texto quando ela é escura o bastante", () => {
    const theme = buildStoreTheme({ brand_colors: ["#1C1917", "#FAF8F5", "#C9A227"] }) as Theme;
    expect(theme["--foreground"]).toBe("#1C1917");
  });

  it("cai no padrão quando não há paleta configurada", () => {
    const theme = buildStoreTheme({ brand_colors: [] }) as Theme;
    expect(theme["--brand-1"]).toBeTruthy();
  });

  it("usa a 2ª cor como fundo real da página quando já é clara", () => {
    const theme = buildStoreTheme({ brand_colors: ["#1C1917", "#FAF8F5", "#C9A227"] }) as Theme;
    expect(theme["--background"]).toBe("#FAF8F5");
    expect(theme["--secondary"]).toBe("#FAF8F5");
  });

  // Antes, uma 2ª cor escura era ignorada em silêncio e o fundo não mudava
  // nada — a proprietária escolhia a cor e não via efeito nenhum no site.
  it("clareia a 2ª cor em vez de descartá-la quando é escura demais para fundo", () => {
    const theme = buildStoreTheme({ brand_colors: ["#1C1917", "#9691B3", "#C9A227"] }) as Theme;
    expect(theme["--background"]).toBeDefined();
    expect(theme["--background"]).not.toBe("#9691B3");
    expect(isLight(theme["--background"]!)).toBe(true);
  });
});

describe("contraste", () => {
  it("isDarkEnoughForText aceita tons escuros e rejeita pastéis", () => {
    expect(isDarkEnoughForText("#1C1917")).toBe(true);
    expect(isDarkEnoughForText("#D7D4CF")).toBe(false);
    expect(isDarkEnoughForText("#92AC95")).toBe(false);
  });

  it("isLight identifica fundos claros", () => {
    expect(isLight("#FAF8F5")).toBe(true);
    expect(isLight("#1C1917")).toBe(false);
  });
});
