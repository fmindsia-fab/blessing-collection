import { describe, expect, it } from "vitest";
import {
  describeSelection,
  groupVariants,
  missingRequiredGroups,
  priceWithVariants,
  variantSurchargeCents,
  DEFAULT_VARIANT_GROUP,
  type VariantOption,
} from "@/lib/pricing/variants";

function variant(
  name: string,
  price: number | null = null,
  group: string | null = null,
  status = "available",
): VariantOption {
  return { id: name, name, price, status, variant_group: group };
}

function required(name: string, price: number | null = null, group = "Alça"): VariantOption {
  return { ...variant(name, price, group), is_required: true };
}

// O caso real da Clutch Bellagio: base 369,90 e alça de corrente a 409,90.
const BASE = 36_990;

describe("groupVariants", () => {
  // Sem grupos, escolher "Marrom" desmarcaria "Alça Corrente" — mas a cliente
  // quer as duas.
  it("separa cor de outros eixos de escolha", () => {
    const grupos = groupVariants([
      variant("Marrom", null, "Cor"),
      variant("Bege", null, "Cor"),
      variant("Alça Corrente", 409.9, "Alça"),
    ]);

    expect(grupos).toHaveLength(2);
    expect(grupos[0].name).toBe("Cor");
    expect(grupos[0].options).toHaveLength(2);
    expect(grupos[1].name).toBe("Alça");
  });

  it("reúne variações sem grupo sob um rótulo padrão", () => {
    const grupos = groupVariants([variant("Marrom"), variant("Bege")]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].name).toBe(DEFAULT_VARIANT_GROUP);
  });

  it("trata grupo em branco como sem grupo", () => {
    const grupos = groupVariants([variant("Marrom", null, "   ")]);

    expect(grupos[0].name).toBe(DEFAULT_VARIANT_GROUP);
  });

  it("preserva a ordem de cadastro dentro do grupo", () => {
    const grupos = groupVariants([
      variant("Marrom", null, "Cor"),
      variant("Alça", 409.9, "Alça"),
      variant("Bege", null, "Cor"),
    ]);

    expect(grupos[0].options.map((o) => o.name)).toEqual(["Marrom", "Bege"]);
  });
});

describe("variantSurchargeCents", () => {
  it("deriva o adicional da diferença para o preço base", () => {
    expect(variantSurchargeCents(variant("Alça", 409.9), BASE)).toBe(4_000);
  });

  it("é zero quando a variação não tem preço próprio", () => {
    expect(variantSurchargeCents(variant("Marrom"), BASE)).toBe(0);
  });

  // Variação mais barata que a base seria desconto; somar negativo produziria
  // um total confuso.
  it("nunca é negativo", () => {
    expect(variantSurchargeCents(variant("Promo", 300), BASE)).toBe(0);
  });
});

describe("priceWithVariants", () => {
  it("mantém o preço base sem escolha alguma", () => {
    expect(priceWithVariants(BASE, [])).toBe(BASE);
  });

  it("soma o adicional de uma escolha", () => {
    expect(priceWithVariants(BASE, [variant("Alça", 409.9)])).toBe(40_990);
  });

  // O ponto do pedido: cor e alça convivem, e os adicionais somam.
  it("soma os adicionais de escolhas em grupos diferentes", () => {
    const selecao = [
      variant("Marrom", null, "Cor"),
      variant("Alça Corrente", 409.9, "Alça"),
      variant("Bordado", 394.9, "Acabamento"),
    ];

    // 369,90 + 40,00 + 25,00
    expect(priceWithVariants(BASE, selecao)).toBe(43_490);
  });

  it("ignora escolhas sem preço na soma", () => {
    expect(priceWithVariants(BASE, [variant("Marrom"), variant("Bege")])).toBe(BASE);
  });
});

describe("describeSelection", () => {
  it("lista as escolhas separadas por vírgula", () => {
    expect(describeSelection([variant("Marrom"), variant("Alça Corrente")])).toBe(
      "Marrom, Alça Corrente",
    );
  });

  it("devolve null sem escolha", () => {
    expect(describeSelection([])).toBeNull();
  });
});

describe("escolha obrigatória e complementos", () => {
  const alcas = [
    variant("Alça Tiracolo", 475, "Alça"),
    required("Alça Metal", 409.9),
    required("Alça Madeira", 450),
    variant("Alça Duo", 519, "Alça"),
    variant("Marrom", null, "Cor"),
  ];

  it("separa as obrigatórias dos complementos do mesmo grupo, obrigatórias primeiro", () => {
    const grupos = groupVariants(alcas);

    expect(grupos.map((g) => [g.label, g.required])).toEqual([
      ["Alça", true],
      ["Alça · complementos", false],
      ["Cor", false],
    ]);
    expect(grupos[0].options.map((o) => o.name)).toEqual(["Alça Metal", "Alça Madeira"]);
    expect(grupos[1].options.map((o) => o.name)).toEqual(["Alça Tiracolo", "Alça Duo"]);
  });

  it("grupo sem obrigatórias mantém o nome simples (não vira 'complementos')", () => {
    expect(groupVariants([variant("Marrom", null, "Cor")])[0].label).toBe("Cor");
  });

  it("aponta as escolhas obrigatórias que faltam", () => {
    const grupos = groupVariants(alcas);
    expect(missingRequiredGroups(grupos, {}).map((g) => g.name)).toEqual(["Alça"]);

    const escolhida = { [grupos[0].key]: "Alça Metal" };
    expect(missingRequiredGroups(grupos, escolhida)).toEqual([]);
  });

  it("obrigatória com todas as opções esgotadas não trava a compra", () => {
    const grupos = groupVariants([required("Alça Metal", 409.9, "Alça"), required("Alça Madeira", 450, "Alça")].map((v) => ({ ...v, status: "sold_out" })));
    expect(missingRequiredGroups(grupos, {})).toEqual([]);
  });
});

