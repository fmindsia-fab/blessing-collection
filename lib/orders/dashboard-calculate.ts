/**
 * Cálculos puros do dashboard de pedidos — sem acesso a banco, testáveis
 * isolados (mesmo padrão de lib/orders/calculate.ts).
 */

export type OrderFinancialInput = {
  status: string;
  /** Valor de referência do pedido — sempre o total dos itens, nunca sinal+saldo. */
  totalAmount: number;
  depositAmount: number;
  depositPaidAt: string | null;
  balanceAmount: number;
  balancePaidAt: string | null;
};

export type FinancialSummary = {
  received: number;
  pending: number;
  averageTicket: number;
};

/**
 * `total_amount` (soma dos itens) é sempre o valor de referência do pedido.
 * Sinal e saldo registram COMO e QUANDO o pagamento aconteceu, não um valor
 * financeiro paralelo — por isso o "pago" de cada pedido é limitado ao seu
 * total (min), mesmo que sinal+saldo somados sejam preenchidos com um valor
 * diferente (parcial, ou por engano maior que o pedido).
 *
 * Recebido = soma do pago (limitado ao total) em pedidos não cancelados.
 * A receber = total − recebido, por pedido, somado.
 * Ticket médio = total_amount médio dos pedidos não cancelados.
 */
export function calculateFinancialSummary(orders: OrderFinancialInput[]): FinancialSummary {
  let received = 0;
  let pending = 0;
  let totalValue = 0;
  let countedOrders = 0;

  for (const order of orders) {
    if (order.status === "cancelled") continue;

    countedOrders += 1;
    totalValue += order.totalAmount;

    const paid =
      (order.depositPaidAt ? order.depositAmount : 0) + (order.balancePaidAt ? order.balanceAmount : 0);
    const orderReceived = Math.min(paid, order.totalAmount);

    received += orderReceived;
    pending += order.totalAmount - orderReceived;
  }

  return {
    received,
    pending,
    averageTicket: countedOrders > 0 ? totalValue / countedOrders : 0,
  };
}

export type StatusCount = { status: string; count: number; totalAmount: number };

/** Contagem e soma de valor por status — para os cards "N pedidos em X". */
export function calculateStatusBreakdown(
  orders: { status: string; totalAmount: number }[],
): StatusCount[] {
  const byStatus = new Map<string, StatusCount>();

  for (const order of orders) {
    const existing = byStatus.get(order.status);
    if (existing) {
      existing.count += 1;
      existing.totalAmount += order.totalAmount;
    } else {
      byStatus.set(order.status, { status: order.status, count: 1, totalAmount: order.totalAmount });
    }
  }

  return [...byStatus.values()];
}

export type TopEntry = { key: string; label: string; count: number; totalAmount: number };

/** Top N por contagem de pedidos (desempate por valor total), agregando por chave (produto/cliente). */
export function calculateTopEntries(
  entries: { key: string; label: string; amount: number }[],
  limit = 5,
): TopEntry[] {
  const aggregated = new Map<string, TopEntry>();

  for (const entry of entries) {
    const existing = aggregated.get(entry.key);
    if (existing) {
      existing.count += 1;
      existing.totalAmount += entry.amount;
    } else {
      aggregated.set(entry.key, { key: entry.key, label: entry.label, count: 1, totalAmount: entry.amount });
    }
  }

  return [...aggregated.values()]
    .sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount)
    .slice(0, limit);
}
