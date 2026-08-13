import { FULL_BASIS_POINTS, applyPercent, toCents } from "./money";

/**
 * Fórmulas de formação de preço.
 *
 * Todos os valores monetários circulam em centavos e os percentuais em basis
 * points (1% = 100), para as somas de alíquotas não acumularem erro de ponto
 * flutuante. Só a apresentação converte de volta para reais.
 */

// ========== MÃO DE OBRA ==========

export type LaborSettings = {
  /** Quanto a proprietária quer receber por mês, em centavos. */
  monthlyPayCents: number;
  /** Aluguel, energia, internet, DAS do MEI… em centavos. */
  monthlyFixedCostCents: number;
  /** Horas efetivamente produtivas no mês — não as horas do mês. */
  productiveHoursPerMonth: number;
};

export type LaborRates = {
  laborPerHourCents: number;
  fixedCostPerHourCents: number;
  totalPerHourCents: number;
};

/**
 * Converte os totais mensais em valor por hora.
 *
 * Horas produtivas, e não horas trabalhadas: o tempo gasto respondendo cliente,
 * fotografando e indo ao correio não vira peça, mas precisa ser pago pelas
 * horas que viram. Dividir pelo total inflaria a base e barataria a peça.
 */
export function calculateLaborRates(settings: LaborSettings): LaborRates {
  const hours = settings.productiveHoursPerMonth;

  if (hours <= 0) {
    return { laborPerHourCents: 0, fixedCostPerHourCents: 0, totalPerHourCents: 0 };
  }

  const laborPerHourCents = Math.round(settings.monthlyPayCents / hours);
  const fixedCostPerHourCents = Math.round(settings.monthlyFixedCostCents / hours);

  return {
    laborPerHourCents,
    fixedCostPerHourCents,
    totalPerHourCents: laborPerHourCents + fixedCostPerHourCents,
  };
}

// ========== CUSTO DA PEÇA ==========

export type Material = {
  description: string;
  /** Quantidade usada na peça — aceita fração (0,4 novelo). */
  quantity: number;
  unitCostCents: number;
};

export type CostBreakdown = {
  materialsCents: number;
  laborCents: number;
  fixedCostShareCents: number;
  otherCostsCents: number;
  totalCents: number;
};

export function calculateMaterialCost(material: Material): number {
  return Math.round(material.quantity * material.unitCostCents);
}

export function calculateCost({
  materials,
  productionHours,
  rates,
  otherCostsCents = 0,
}: {
  materials: Material[];
  productionHours: number;
  rates: LaborRates;
  otherCostsCents?: number;
}): CostBreakdown {
  const materialsCents = materials.reduce((sum, m) => sum + calculateMaterialCost(m), 0);
  const laborCents = Math.round(productionHours * rates.laborPerHourCents);
  const fixedCostShareCents = Math.round(productionHours * rates.fixedCostPerHourCents);

  return {
    materialsCents,
    laborCents,
    fixedCostShareCents,
    otherCostsCents,
    totalCents: materialsCents + laborCents + fixedCostShareCents + otherCostsCents,
  };
}

// ========== PREÇO ==========

export type PricingMethod = "margin" | "markup";

export type PricingInput = {
  totalCostCents: number;
  method: PricingMethod;
  /** Margem sobre o preço, ou markup sobre o custo, em basis points. */
  rateBasisPoints: number;
  /** Alíquotas que incidem sobre a venda (maquininha, Simples), em bp. */
  feeBasisPoints: number;
};

export type PricingResult =
  | { ok: true; priceCents: number }
  | { ok: false; error: string };

/**
 * Preço de venda pelo método escolhido.
 *
 * Margem sobre o preço (padrão): `custo / (1 - margem - taxas)`. O percentual
 * digitado é o que de fato sobra depois das taxas — é o que a proprietária
 * espera ao dizer "quero 30%".
 *
 * Markup sobre o custo: `custo * (1 + markup)`, e o resultado é dividido por
 * `(1 - taxas)` para que as taxas não corroam o valor líquido pretendido.
 *
 * A diferença importa: com custo 100, 30% e taxa de 5%, a margem devolve
 * R$ 153,85 (lucro real de 30%) e o markup devolve R$ 136,84 (lucro real de
 * ~21%). Markup não é margem, e confundir os dois é o erro mais comum aqui.
 */
export function calculatePrice(input: PricingInput): PricingResult {
  const { totalCostCents, method, rateBasisPoints, feeBasisPoints } = input;

  if (totalCostCents <= 0) {
    return { ok: false, error: "Informe os custos da peça antes de calcular o preço." };
  }
  if (rateBasisPoints < 0 || feeBasisPoints < 0) {
    return { ok: false, error: "Percentuais não podem ser negativos." };
  }
  if (feeBasisPoints >= FULL_BASIS_POINTS) {
    return { ok: false, error: "As taxas sobre a venda não podem chegar a 100%." };
  }

  if (method === "margin") {
    const denominator = FULL_BASIS_POINTS - rateBasisPoints - feeBasisPoints;

    // Margem + taxas >= 100% não tem solução: o preço tenderia ao infinito.
    if (denominator <= 0) {
      return {
        ok: false,
        error:
          "Margem e taxas somam 100% ou mais — nesse cenário não existe preço possível. Reduza a margem.",
      };
    }

    return {
      ok: true,
      priceCents: Math.round((totalCostCents * FULL_BASIS_POINTS) / denominator),
    };
  }

  const baseCents = totalCostCents + applyPercent(totalCostCents, rateBasisPoints);
  const netFactor = FULL_BASIS_POINTS - feeBasisPoints;

  return { ok: true, priceCents: Math.round((baseCents * FULL_BASIS_POINTS) / netFactor) };
}

// ========== RESULTADO POR FORMA DE PAGAMENTO ==========

export type PaymentMethod = {
  id: string;
  label: string;
  /** Taxa da adquirente para esta modalidade, em basis points. */
  feeBasisPoints: number;
  installments: number;
};

export type PaymentBreakdown = {
  method: PaymentMethod;
  priceCents: number;
  installmentCents: number;
  feeCents: number;
  netReceivedCents: number;
  profitCents: number;
  /** Margem líquida real sobre o preço, em basis points. */
  netMarginBasisPoints: number;
};

/**
 * Fecha a conta de cada forma de pagamento.
 *
 * O preço é único — a peça não muda de etiqueta conforme o cartão. O que muda é
 * quanto sobra: uma venda no crédito em 6x com taxa maior devolve menos que o
 * Pix. Mostrar isso lado a lado é o que permite decidir se vale oferecer
 * parcelamento, e a partir de quantas parcelas o lucro deixa de compensar.
 */
export function calculatePaymentBreakdown({
  priceCents,
  totalCostCents,
  methods,
  taxBasisPoints = 0,
}: {
  priceCents: number;
  totalCostCents: number;
  methods: PaymentMethod[];
  /** Alíquota de imposto sobre a venda (Simples), em bp. MEI entra como custo fixo. */
  taxBasisPoints?: number;
}): PaymentBreakdown[] {
  return methods.map((method) => {
    const feeCents = applyPercent(priceCents, method.feeBasisPoints + taxBasisPoints);
    const netReceivedCents = priceCents - feeCents;
    const profitCents = netReceivedCents - totalCostCents;

    return {
      method,
      priceCents,
      installmentCents:
        method.installments > 1 ? Math.round(priceCents / method.installments) : priceCents,
      feeCents,
      netReceivedCents,
      profitCents,
      netMarginBasisPoints:
        priceCents > 0 ? Math.round((profitCents * FULL_BASIS_POINTS) / priceCents) : 0,
    };
  });
}

/**
 * Markup equivalente a uma margem, e vice-versa.
 *
 * Serve para mostrar os dois indicadores lado a lado sem que a proprietária
 * precise refazer a conta: 50% de margem equivalem a 100% de markup.
 */
export function marginToMarkup(marginBasisPoints: number): number | null {
  const denominator = FULL_BASIS_POINTS - marginBasisPoints;
  if (denominator <= 0) return null;

  return Math.round((marginBasisPoints * FULL_BASIS_POINTS) / denominator);
}

export function markupToMargin(markupBasisPoints: number): number {
  const denominator = FULL_BASIS_POINTS + markupBasisPoints;

  return Math.round((markupBasisPoints * FULL_BASIS_POINTS) / denominator);
}

/** Preço com a vírgula do jeito que a proprietária digita ("12,50"). */
export function parseCurrencyInput(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? toCents(parsed) : 0;
}
