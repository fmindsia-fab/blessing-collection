import { basisPointsToPercent, percentToBasisPoints } from "./money";

/**
 * Taxa total da forma de pagamento: soma simples da taxa por venda com a de
 * parcelamento, que é como o banco cobra. Soma em basis points para não
 * acumular erro de ponto flutuante (3,34 + 2,75 não é exatamente 6,09).
 */
export function sumFeePercent(adminFeePercent: number, installmentFeePercent: number): number {
  return basisPointsToPercent(
    percentToBasisPoints(adminFeePercent) + percentToBasisPoints(installmentFeePercent),
  );
}

/**
 * Forma que deveria ter taxa mas está com zero: a loja absorveria o custo sem
 * perceber. Pix e dinheiro não cobram; débito e crédito (ou qualquer parcelado) sim.
 */
export function isMissingFee(label: string, installments: number, feePercent: number): boolean {
  if (feePercent > 0) return false;
  if (installments > 1) return true;
  const normalized = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return normalized.includes("credito") || normalized.includes("debito");
}
