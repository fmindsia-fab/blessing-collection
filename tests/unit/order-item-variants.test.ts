import { describe, expect, it } from "vitest";
import {
  buildItemVariantRows,
  describeItemVariants,
  parseVariantIds,
  type VariantRecord,
} from "@/lib/orders/item-variants";

const PRODUCT = "produto-1";

const record = (id: string, group: string | null, price: number | null, extra: Partial<VariantRecord> = {}): VariantRecord => ({
  id,
  product_id: PRODUCT,
  name: `Opção ${id}`,
  variant_group: group,
  price,
  status: "available",
  ...extra,
});

const records = new Map<string, VariantRecord>(
  [
    record("alca-metal", "Alça", 475.9),
    record("alca-duo", "Alça", 519.9),
    record("tassel", "Tassel", 419.9),
    record("cor-areia", "Cor", null),
    record("barata", "Cor", 300),
    record("sem-grupo", null, 430),
    record("arquivada", "Forro", 450, { status: "archived" }),
    record("de-outra-peca", "Forro", 450, { product_id: "outro" }),
  ].map((r) => [r.id, r]),
);

describe("parseVariantIds", () => {
  it("separa por vírgula, ignora vazios e repetidos", () => {
    expect(parseVariantIds("a, b,,a ,c")).toEqual(["a", "b", "c"]);
    expect(parseVariantIds("")).toEqual([]);
    expect(parseVariantIds(null)).toEqual([]);
  });
});

describe("buildItemVariantRows", () => {
  it("aceita nenhuma variação", () => {
    expect(buildItemVariantRows(409.9, [], records, PRODUCT)).toEqual({ rows: [] });
  });

  it("aceita várias variações de grupos diferentes e calcula o acréscimo sobre o preço base", () => {
    const result = buildItemVariantRows(409.9, ["alca-metal", "tassel", "cor-areia"], records, PRODUCT);

    expect("rows" in result).toBe(true);
    if ("rows" in result) {
      expect(result.rows.map((row) => [row.variant_id, row.surcharge])).toEqual([
        ["alca-metal", 66],
        ["tassel", 10],
        ["cor-areia", 0],
      ]);
      expect(result.rows.map((row) => row.sort_order)).toEqual([0, 1, 2]);
    }
  });

  it("variação mais barata que a base não gera acréscimo negativo", () => {
    const result = buildItemVariantRows(409.9, ["barata"], records, PRODUCT);
    expect("rows" in result && result.rows[0].surcharge).toBe(0);
  });

  it("recusa duas opções do mesmo grupo (alça e outra alça)", () => {
    const result = buildItemVariantRows(409.9, ["alca-metal", "alca-duo"], records, PRODUCT);
    expect("error" in result && result.error).toContain("Alça");
  });

  it("variações sem grupo contam como um só grupo", () => {
    const sameGroup = new Map(records);
    sameGroup.set("outra-sem-grupo", record("outra-sem-grupo", null, 440));
    const result = buildItemVariantRows(409.9, ["sem-grupo", "outra-sem-grupo"], sameGroup, PRODUCT);
    expect("error" in result).toBe(true);
  });

  it("recusa variação arquivada, inexistente ou de outra peça", () => {
    expect("error" in buildItemVariantRows(409.9, ["arquivada"], records, PRODUCT)).toBe(true);
    expect("error" in buildItemVariantRows(409.9, ["nao-existe"], records, PRODUCT)).toBe(true);
    expect("error" in buildItemVariantRows(409.9, ["de-outra-peca"], records, PRODUCT)).toBe(true);
  });
});

describe("describeItemVariants", () => {
  it("junta os nomes e devolve null sem variações", () => {
    expect(describeItemVariants([{ name: "Alça Metal" }, { name: "Tassel" }])).toBe("Alça Metal, Tassel");
    expect(describeItemVariants([])).toBeNull();
  });
});
