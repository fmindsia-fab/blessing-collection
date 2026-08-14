import { describe, expect, it } from "vitest";
import {
  describeSelection,
  groupVariants,
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
