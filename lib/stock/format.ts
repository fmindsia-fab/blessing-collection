// Formatação de números do estoque para a tela (pt-BR).

/** Quantidade sem zeros inúteis: 1000 -> "1.000", 0.5 -> "0,5", 2.125 -> "2,125". */
export function formatQuantity(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Custo por unidade pode ter fração de centavo (R$ 0,09/g): mostra até 4 casas quando precisa. */
export function formatUnitCost(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** "2026-10-24" -> "24/10/2026", sem passar por fuso horário. */
export function formatDateBR(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
