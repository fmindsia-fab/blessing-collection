import { describe, expect, it } from "vitest";
import { parseCatalogSort } from "@/lib/catalog/sort";

describe("parseCatalogSort", () => {
  it("aceita as ordens conhecidas", () => {
    expect(parseCatalogSort("novidades")).toBe("novidades");
    expect(parseCatalogSort("menor-preco")).toBe("menor-preco");
    expect(parseCatalogSort("maior-preco")).toBe("maior-preco");
  });

  it("qualquer outro valor na URL volta à ordem da loja", () => {
    expect(parseCatalogSort(undefined)).toBeUndefined();
    expect(parseCatalogSort("")).toBeUndefined();
    expect(parseCatalogSort("price; drop table products")).toBeUndefined();
  });
});
