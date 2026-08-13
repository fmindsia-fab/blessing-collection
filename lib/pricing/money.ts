/**
 * Aritmética monetária em centavos.
 *
 * Reais como float acumulam erro: 0.1 + 0.2 dá 0.30000000000000004, e uma
 * ficha de precificação soma dezenas de valores antes de chegar ao preço. Todo
 * cálculo acontece em centavos (inteiros) e só volta a reais na exibição.
 *
 * O banco guarda `numeric(10,2)`, que é decimal exato no Postgres — a conversão
 * acontece na fronteira, ao ler e ao gravar.
 */

/** Reais (como vêm do banco ou de um formulário) para centavos. */
export function toCents(reais: number): number {
  // O epsilon corrige o caso em que a multiplicação cai logo abaixo do inteiro:
  // 19.99 * 100 = 1998.9999999999998, que truncaria para 1998.
  return Math.round((reais + Number.EPSILON) * 100);
}

/** Centavos para reais, com duas casas — só para exibir ou gravar. */
export function toReais(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatBRL(cents: number): string {
  return toReais(cents).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Percentual (30 para 30%) como fração decimal, em milésimos de ponto.
 *
 * Guardar a fração como float traria o mesmo problema dos reais: 0.1 + 0.05
 * não é exatamente 0.15. Trabalhar com basis points (1% = 100) mantém as somas
 * de alíquotas exatas.
 */
export function percentToBasisPoints(percent: number): number {
  return Math.round((percent + Number.EPSILON) * 100);
}

export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100;
}

/** Aplica um percentual (em basis points) sobre um valor em centavos. */
export function applyPercent(cents: number, basisPoints: number): number {
  return Math.round((cents * basisPoints) / 10_000);
}

export const FULL_BASIS_POINTS = 10_000;
