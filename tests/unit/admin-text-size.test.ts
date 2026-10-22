import { describe, expect, it } from "vitest";
import { TEXT_SIZE_PERCENT, parseTextSize } from "@/lib/store/admin-theme";

describe("parseTextSize", () => {
  it("aceita os tamanhos válidos", () => {
    expect(parseTextSize("large")).toBe("large");
    expect(parseTextSize("xlarge")).toBe("xlarge");
  });

  it("cai em normal para valor ausente ou adulterado no cookie", () => {
    expect(parseTextSize(undefined)).toBe("normal");
    expect(parseTextSize("gigante")).toBe("normal");
    expect(parseTextSize("</style><script>")).toBe("normal");
  });

  it("só gera escalas numéricas conhecidas (vão direto para um <style> no servidor)", () => {
    for (const percent of Object.values(TEXT_SIZE_PERCENT)) {
      expect(Number.isFinite(percent)).toBe(true);
    }
  });
});
