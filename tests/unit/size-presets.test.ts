import { describe, expect, it } from "vitest";
import { SIZE_PRESETS } from "@/lib/products/size-presets";

describe("SIZE_PRESETS", () => {
  it("artesanato não sugere tamanho (mantém o comportamento atual)", () => {
    expect(SIZE_PRESETS.artisan).toBeNull();
  });

  it("roupas sugere grade P/M/G sob o grupo Tamanho", () => {
    expect(SIZE_PRESETS.clothing).toEqual({
      group: "Tamanho",
      values: ["PP", "P", "M", "G", "GG", "XG"],
    });
  });

  it("calçados sugere numeração 33-44 sob o grupo Numeração", () => {
    expect(SIZE_PRESETS.footwear?.group).toBe("Numeração");
    expect(SIZE_PRESETS.footwear?.values).toContain("38");
    expect(SIZE_PRESETS.footwear?.values).toHaveLength(12);
  });
});
