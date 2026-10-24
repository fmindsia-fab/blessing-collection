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

describe("obrigatórias e complementos do mesmo grupo", () => {
  const set = new Map<string, VariantRecord>(
    [
      record("madeira", "Alça", 450, { is_required: true }),
      record("metal", "Alça", 409.9, { is_required: true }),
      record("tiracolo", "Alça", 475, { is_required: false }),
      record("duo", "Alça", 519, { is_required: false }),
    ].map((r) => [r.id, r]),
  );

  it("aceita uma obrigatória junto com um complemento do mesmo grupo", () => {
    const result = buildItemVariantRows(409.9, ["metal", "tiracolo"], set, PRODUCT);
    expect("rows" in result && result.rows.map((row) => row.variant_id)).toEqual(["metal", "tiracolo"]);
  });

  it("recusa duas obrigatórias ou dois complementos do mesmo grupo", () => {
    expect("error" in buildItemVariantRows(409.9, ["madeira", "metal"], set, PRODUCT)).toBe(true);
    const twoOptional = buildItemVariantRows(409.9, ["tiracolo", "duo"], set, PRODUCT);
    expect("error" in twoOptional && twoOptional.error).toContain("complementos");
  });
});

describe("grupo que aceita mais de uma escolha", () => {
  const multi = new Map<string, VariantRecord>(
    [
      record("tiracolo", "Alça", 475, { allow_multiple: true }),
      record("duo", "Alça", 519, { allow_multiple: true }),
      record("cor1", "Cor", null),
      record("cor2", "Cor", null),
    ].map((r) => [r.id, r]),
  );

  it("aceita duas alças quando o grupo permite", () => {
    const result = buildItemVariantRows(409.9, ["tiracolo", "duo"], multi, PRODUCT);
    expect("rows" in result && result.rows.length).toBe(2);
  });

  it("continua recusando duas opções de um grupo que não permite (cor)", () => {
    expect("error" in buildItemVariantRows(409.9, ["cor1", "cor2"], multi, PRODUCT)).toBe(true);
  });
});

describe("material da variação copiado no pedido", () => {
  const comMaterial = new Map<string, VariantRecord>(
    [
      record("alca", "Alça", 475, { material_id: "mat-alca", material_quantity: 2 }),
      record("cor", "Cor", null),
    ].map((r) => [r.id, r]),
  );

  it("copia o material e a quantidade só das variações escolhidas", () => {
    const result = buildItemVariantRows(409.9, ["alca", "cor"], comMaterial, PRODUCT);

    expect("rows" in result && result.rows.map((r) => [r.variant_id, r.material_id, r.material_quantity])).toEqual([
      ["alca", "mat-alca", 2],
      ["cor", null, 1],
    ]);
  });

  it("variação não escolhida não leva material nenhum", () => {
    const result = buildItemVariantRows(409.9, ["cor"], comMaterial, PRODUCT);

    expect("rows" in result && result.rows.some((r) => r.material_id)).toBe(false);
  });
});

