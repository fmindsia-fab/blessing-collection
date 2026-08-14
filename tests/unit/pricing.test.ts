import { describe, expect, it } from "vitest";
import {
  calculateCost,
  calculateInstallmentOptions,
  calculateLaborRates,
  calculateMaterialCost,
  calculatePaymentBreakdown,
  calculatePrice,
  marginToMarkup,
  markupToMargin,
  parseCurrencyInput,
  roundToCommercialPrice,
  suggestRoundedPrices,
} from "@/lib/pricing/calculate";
import {
  applyPercent,
  formatBRL,
  percentToBasisPoints,
  toCents,
  toReais,
} from "@/lib/pricing/money";

const pct = percentToBasisPoints;

describe("money", () => {
  it("converte reais e centavos sem perder precisão", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1)).toBe(10);
    expect(toReais(1999)).toBe(19.99);
  });

  // 19.99 * 100 dá 1998.9999999999998 em float; truncar devolveria 1998.
  it("não perde um centavo no arredondamento binário", () => {
    for (const valor of [19.99, 0.29, 1.15, 8.07, 1234.56]) {
      expect(toReais(toCents(valor))).toBe(valor);
    }
  });

  it("soma centavos sem o erro de 0.1 + 0.2", () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(30);
    expect(toReais(toCents(0.1) + toCents(0.2))).toBe(0.3);
  });

  it("aplica percentual sobre centavos", () => {
    expect(applyPercent(10_000, pct(5))).toBe(500);
    expect(applyPercent(17_881, pct(5))).toBe(894);
  });

  it("formata em real brasileiro", () => {
    expect(formatBRL(15_385)).toContain("153,85");
  });
});

describe("calculateLaborRates", () => {
  // Remuneração 2.000, custos fixos 800, 100 horas produtivas.
  it("divide os totais mensais pelas horas produtivas", () => {
    const rates = calculateLaborRates({
      monthlyPayCents: 200_000,
      monthlyFixedCostCents: 80_000,
      productiveHoursPerMonth: 100,
    });

    expect(rates.laborPerHourCents).toBe(2_000);
    expect(rates.fixedCostPerHourCents).toBe(800);
    expect(rates.totalPerHourCents).toBe(2_800);
  });

  // Sem horas informadas a divisão seria por zero.
  it("devolve zero quando as horas produtivas não foram informadas", () => {
    const rates = calculateLaborRates({
      monthlyPayCents: 200_000,
      monthlyFixedCostCents: 80_000,
      productiveHoursPerMonth: 0,
    });

    expect(rates.totalPerHourCents).toBe(0);
  });
});

describe("calculateCost", () => {
  const rates = { laborPerHourCents: 2_000, fixedCostPerHourCents: 800, totalPerHourCents: 2_800 };

  it("multiplica quantidade por custo unitário, aceitando fração", () => {
    // 0,4 novelo a R$ 32,50.
    expect(calculateMaterialCost({ description: "Fio", quantity: 0.4, unitCostCents: 3_250 })).toBe(
      1_300,
    );
  });

  it("separa materiais, mão de obra e rateio de custo fixo", () => {
    const cost = calculateCost({
      materials: [
        { description: "Fio", quantity: 2, unitCostCents: 3_250 },
        { description: "Alça", quantity: 1, unitCostCents: 1_800 },
        { description: "Fecho", quantity: 1, unitCostCents: 900 },
      ],
      productionHours: 4,
      rates,
      otherCostsCents: 500,
    });

    expect(cost.materialsCents).toBe(9_200);
    expect(cost.laborCents).toBe(8_000);
    expect(cost.fixedCostShareCents).toBe(3_200);
    expect(cost.otherCostsCents).toBe(500);
    expect(cost.totalCents).toBe(20_900);
  });

  it("aceita peça sem material, só com tempo de trabalho", () => {
    const cost = calculateCost({ materials: [], productionHours: 2, rates });

    expect(cost.materialsCents).toBe(0);
    expect(cost.totalCents).toBe(5_600);
  });
});

describe("calculatePrice — margem sobre o preço", () => {
  // O exemplo da especificação: custo 178,81 / margem 50% / taxa 5%.
  it("resolve o exemplo da especificação", () => {
    const result = calculatePrice({
      totalCostCents: 17_881,
      method: "margin",
      rateBasisPoints: pct(50),
      feeBasisPoints: pct(5),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.priceCents).toBe(39_736);
  });

  // A razão de ser do método: o percentual digitado precisa ser o que sobra.
  it("entrega exatamente a margem pedida depois das taxas", () => {
    const result = calculatePrice({
      totalCostCents: 10_000,
      method: "margin",
      rateBasisPoints: pct(30),
      feeBasisPoints: pct(5),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.priceCents).toBe(15_385);

    const taxas = applyPercent(result.priceCents, pct(5));
    const lucro = result.priceCents - taxas - 10_000;
    const margemReal = (lucro / result.priceCents) * 100;

    expect(margemReal).toBeCloseTo(30, 1);
  });

  it("funciona sem taxa nenhuma", () => {
    const result = calculatePrice({
      totalCostCents: 10_000,
      method: "margin",
      rateBasisPoints: pct(50),
      feeBasisPoints: 0,
    });

    if (result.ok) expect(result.priceCents).toBe(20_000);
  });

  // Margem + taxas >= 100% não tem solução: o preço tenderia ao infinito.
  it("recusa margem que somada às taxas chega a 100%", () => {
    const result = calculatePrice({
      totalCostCents: 10_000,
      method: "margin",
      rateBasisPoints: pct(95),
      feeBasisPoints: pct(5),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("100%");
  });

  it("recusa margem acima de 100%", () => {
    const result = calculatePrice({
      totalCostCents: 10_000,
      method: "margin",
      rateBasisPoints: pct(120),
      feeBasisPoints: 0,
    });

    expect(result.ok).toBe(false);
  });

  it("recusa cálculo sem custo informado", () => {
    const result = calculatePrice({
      totalCostCents: 0,
      method: "margin",
      rateBasisPoints: pct(50),
      feeBasisPoints: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("custos");
  });
});

describe("calculatePrice — markup sobre o custo", () => {
  // Exemplo da especificação: custo 178,81, markup 100%, taxa 5%.
  it("resolve o exemplo da especificação", () => {
    const result = calculatePrice({
      totalCostCents: 17_881,
      method: "markup",
      rateBasisPoints: pct(100),
      feeBasisPoints: pct(5),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.priceCents).toBe(37_644);
  });

  it("dobra o custo com markup de 100% e nenhuma taxa", () => {
    const result = calculatePrice({
      totalCostCents: 17_881,
      method: "markup",
      rateBasisPoints: pct(100),
      feeBasisPoints: 0,
    });

    if (result.ok) expect(result.priceCents).toBe(35_762);
  });

  // O ponto que o usuário precisava enxergar: markup 30% não é margem 30%.
  it("entrega menos que a margem para o mesmo percentual", () => {
    const margem = calculatePrice({
      totalCostCents: 10_000,
      method: "margin",
      rateBasisPoints: pct(30),
      feeBasisPoints: pct(5),
    });
    const markup = calculatePrice({
      totalCostCents: 10_000,
      method: "markup",
      rateBasisPoints: pct(30),
      feeBasisPoints: pct(5),
    });

    if (!margem.ok || !markup.ok) throw new Error("ambos deveriam calcular");

    expect(markup.priceCents).toBeLessThan(margem.priceCents);
    expect(markup.priceCents).toBe(13_684);
  });
});

describe("conversão entre margem e markup", () => {
  // 50% de margem equivalem a 100% de markup — a equivalência clássica.
  it("converte margem em markup", () => {
    expect(marginToMarkup(pct(50))).toBe(pct(100));
    expect(marginToMarkup(pct(20))).toBe(pct(25));
  });

  it("converte markup em margem", () => {
    expect(markupToMargin(pct(100))).toBe(pct(50));
    expect(markupToMargin(pct(25))).toBe(pct(20));
  });

  it("não existe markup equivalente a 100% de margem", () => {
    expect(marginToMarkup(pct(100))).toBeNull();
  });
});

describe("calculatePaymentBreakdown", () => {
  const methods = [
    { id: "pix", label: "Pix", feeBasisPoints: 0, installments: 1 },
    { id: "debito", label: "Débito", feeBasisPoints: pct(1.99), installments: 1 },
    { id: "credito6", label: "Crédito 6x", feeBasisPoints: pct(8.5), installments: 6 },
  ];

  it("mantém o preço e varia o que sobra", () => {
    const linhas = calculatePaymentBreakdown({
      priceCents: 40_000,
      totalCostCents: 17_881,
      methods,
    });

    // O preço de etiqueta é o mesmo em todas as formas.
    expect(linhas.every((l) => l.priceCents === 40_000)).toBe(true);

    const pix = linhas[0];
    expect(pix.feeCents).toBe(0);
    expect(pix.profitCents).toBe(22_119);

    const credito = linhas[2];
    expect(credito.feeCents).toBe(3_400);
    expect(credito.netReceivedCents).toBe(36_600);
    expect(credito.profitCents).toBe(18_719);
  });

  it("divide o valor da parcela no crédito parcelado", () => {
    const [, , credito] = calculatePaymentBreakdown({
      priceCents: 40_000,
      totalCostCents: 17_881,
      methods,
    });

    expect(credito.installmentCents).toBe(6_667);
  });

  it("soma o imposto do Simples às taxas da maquininha", () => {
    const [pix] = calculatePaymentBreakdown({
      priceCents: 40_000,
      totalCostCents: 17_881,
      methods,
      taxBasisPoints: pct(6),
    });

    // Pix não tem taxa de adquirente, mas o imposto incide igual.
    expect(pix.feeCents).toBe(2_400);
  });

  it("calcula a margem líquida real de cada forma", () => {
    const [pix] = calculatePaymentBreakdown({
      priceCents: 20_000,
      totalCostCents: 10_000,
      methods,
    });

    expect(pix.netMarginBasisPoints).toBe(pct(50));
  });

  // Um preço abaixo do custo precisa aparecer como prejuízo, não sumir.
  it("expõe prejuízo quando o preço não cobre o custo", () => {
    const [pix] = calculatePaymentBreakdown({
      priceCents: 10_000,
      totalCostCents: 17_881,
      methods,
    });

    expect(pix.profitCents).toBeLessThan(0);
    expect(pix.netMarginBasisPoints).toBeLessThan(0);
  });
});

describe("calculateInstallmentOptions — taxa repassada ao cliente", () => {
  const methods = [
    { id: "pix", label: "Pix", feeBasisPoints: 0, installments: 1 },
    { id: "credito1", label: "Crédito 1x", feeBasisPoints: pct(3), installments: 1 },
    { id: "credito3", label: "Crédito 3x", feeBasisPoints: pct(5), installments: 3 },
    { id: "credito12", label: "Crédito 12x", feeBasisPoints: pct(15), installments: 12 },
  ];

  // Somar a taxa não basta: 359,90 + 5% = 377,90, mas a maquininha desconta 5%
  // de 377,90 e sobram 359,00. A divisão é o que fecha a conta.
  it("divide em vez de somar a taxa", () => {
    const [, , credito3] = calculateInstallmentOptions({
      cashPriceCents: 35_990,
      methods,
    });

    expect(credito3.priceCents).toBe(37_884);
    expect(credito3.priceCents).not.toBe(37_790); // o erro de somar 5%
  });

  // A razão de ser do repasse: a proprietária ganha o mesmo em qualquer forma.
  it("preserva o valor líquido em todas as modalidades", () => {
    const opcoes = calculateInstallmentOptions({ cashPriceCents: 35_990, methods });

    for (const opcao of opcoes) {
      // Um centavo de tolerância: o arredondamento da divisão pode variar.
      expect(Math.abs(opcao.netReceivedCents - 35_990)).toBeLessThanOrEqual(1);
    }
  });

  it("mantém o preço à vista quando não há taxa", () => {
    const [pix] = calculateInstallmentOptions({ cashPriceCents: 35_990, methods });

    expect(pix.priceCents).toBe(35_990);
    expect(pix.surchargeCents).toBe(0);
    expect(pix.feeCents).toBe(0);
  });

  it("calcula o valor de cada parcela", () => {
    const [, , credito3] = calculateInstallmentOptions({ cashPriceCents: 35_990, methods });

    // 378,84 / 3 = 126,28
    expect(credito3.installmentCents).toBe(12_628);
  });

  // Arredondar a parcela para baixo faria a soma das parcelas ficar abaixo do
  // preço; para cima, o cliente nunca paga menos que o combinado.
  it("nunca deixa a soma das parcelas abaixo do preço", () => {
    for (const cash of [35_990, 10_000, 9_999, 33_333]) {
      const opcoes = calculateInstallmentOptions({ cashPriceCents: cash, methods });

      for (const opcao of opcoes) {
        const soma = opcao.installmentCents * opcao.method.installments;
        expect(soma).toBeGreaterThanOrEqual(opcao.priceCents);
      }
    }
  });

  it("mostra quanto o cliente paga a mais que no Pix", () => {
    const [, , , credito12] = calculateInstallmentOptions({ cashPriceCents: 35_990, methods });

    expect(credito12.priceCents).toBe(42_341);
    expect(credito12.surchargeCents).toBe(6_351);
  });

  it("descarta modalidade com taxa impossível de repassar", () => {
    const opcoes = calculateInstallmentOptions({
      cashPriceCents: 35_990,
      methods: [{ id: "absurdo", label: "Taxa 100%", feeBasisPoints: pct(100), installments: 1 }],
    });

    expect(opcoes).toEqual([]);
  });

  it("devolve lista vazia sem preço à vista", () => {
    expect(calculateInstallmentOptions({ cashPriceCents: 0, methods })).toEqual([]);
  });
});

describe("roundToCommercialPrice", () => {
  // O caso que motivou a função: 357,56 -> 359,90.
  it("sobe para a terminação ,90 mais próxima acima", () => {
    expect(roundToCommercialPrice(35_756)).toBe(35_990);
  });

  // Arredondar para baixo devolveria um preço abaixo do que a margem pediu, e
  // a perda passaria despercebida.
  it("nunca desce abaixo do preço calculado", () => {
    for (const centavos of [35_756, 10_001, 9_999, 12_395, 50_000, 100]) {
      expect(roundToCommercialPrice(centavos)).toBeGreaterThanOrEqual(centavos);
    }
  });

  // 359,90 já termina em ,90: subir para 369,90 seria aumento gratuito.
  it("mantém o valor quando ele já está na terminação", () => {
    expect(roundToCommercialPrice(35_990)).toBe(35_990);
  });

  // 359,91 passou de ,90 e precisa ir para o próximo.
  it("avança um passo quando o valor passa da terminação", () => {
    expect(roundToCommercialPrice(35_991)).toBe(36_990);
  });

  it("aceita terminação redonda", () => {
    expect(roundToCommercialPrice(35_756, { ending: 0 })).toBe(36_000);
    expect(roundToCommercialPrice(36_000, { ending: 0 })).toBe(36_000);
  });

  // step em centavos: 10.000 = cem reais.
  it("aceita passo de cem reais para ticket alto", () => {
    expect(roundToCommercialPrice(35_756, { ending: 9_900, step: 10_000 })).toBe(39_900);
    expect(roundToCommercialPrice(35_756, { ending: 0, step: 10_000 })).toBe(40_000);
  });

  it("devolve zero para preço inexistente", () => {
    expect(roundToCommercialPrice(0)).toBe(0);
  });
});

describe("suggestRoundedPrices", () => {
  it("oferece as opções acima do preço, em ordem", () => {
    // O caso da tela: 357,56.
    expect(suggestRoundedPrices(35_756)).toEqual([35_990, 36_000, 39_900, 40_000]);
  });

  it("nunca sugere valor abaixo do calculado", () => {
    for (const centavos of [1_234, 35_756, 99_999]) {
      const opcoes = suggestRoundedPrices(centavos);
      expect(opcoes.every((v) => v >= centavos)).toBe(true);
    }
  });

  // Em preços baixos as casas de 1 e 10 reais convergem para o mesmo valor.
  it("não repete opções que coincidem", () => {
    const opcoes = suggestRoundedPrices(500);

    expect(new Set(opcoes).size).toBe(opcoes.length);
  });

  it("devolve lista vazia sem preço", () => {
    expect(suggestRoundedPrices(0)).toEqual([]);
  });
});

describe("parseCurrencyInput", () => {
  it("aceita o formato que a proprietária digita", () => {
    expect(parseCurrencyInput("12,50")).toBe(1_250);
    expect(parseCurrencyInput("1.234,56")).toBe(123_456);
    expect(parseCurrencyInput("32")).toBe(3_200);
  });

  it("devolve zero para entrada inválida ou negativa", () => {
    expect(parseCurrencyInput("")).toBe(0);
    expect(parseCurrencyInput("abc")).toBe(0);
    expect(parseCurrencyInput("-10")).toBe(0);
  });
});
