// Cálculos puros do financeiro (contas a pagar e fluxo de caixa). Datas sempre "AAAA-MM-DD" (sem
// fuso): quem chama passa o "hoje" já no horário de Brasília. Valores em reais.

export const PAYABLE_CATEGORIES = [
  { value: "supplies", label: "Insumos" },
  { value: "packaging", label: "Embalagem" },
  { value: "shipping", label: "Frete" },
  { value: "fees", label: "Taxas" },
  { value: "marketing", label: "Divulgação" },
  { value: "other", label: "Outras" },
] as const;

export function payableCategoryLabel(value: string): string {
  return PAYABLE_CATEGORIES.find((category) => category.value === value)?.label ?? "Outras";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Soma `days` dias a uma data "AAAA-MM-DD" (UTC, sem surpresas de horário de verão). */
export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** "2026-10-24" -> "2026-10". */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Os últimos `count` meses terminando no mês de `today`, do mais antigo para o mais recente. */
export function lastMonths(today: string, count: number): string[] {
  const [year, month] = today.split("-").map(Number);
  const months: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    months.push(date.toISOString().slice(0, 7));
  }
  return months;
}

// ---------- contas a pagar ----------

export type PayableStatus = "paid" | "overdue" | "today" | "upcoming";

export type PayableLike = { dueDate: string; amount: number; paidAt: string | null };

export function payableStatus(payable: PayableLike, today: string): PayableStatus {
  if (payable.paidAt) return "paid";
  if (payable.dueDate < today) return "overdue";
  if (payable.dueDate === today) return "today";
  return "upcoming";
}

export type PayablesSummary = {
  overdue: { count: number; total: number };
  today: { count: number; total: number };
  /** Vence de amanhã até daqui a 7 dias. */
  nextWeek: { count: number; total: number };
  /** Tudo o que está em aberto, vencido ou não. */
  open: { count: number; total: number };
};

export function summarizePayables(payables: PayableLike[], today: string): PayablesSummary {
  const summary: PayablesSummary = {
    overdue: { count: 0, total: 0 },
    today: { count: 0, total: 0 },
    nextWeek: { count: 0, total: 0 },
    open: { count: 0, total: 0 },
  };
  const weekEnd = addDays(today, 7);

  for (const payable of payables) {
    const status = payableStatus(payable, today);
    if (status === "paid") continue;

    summary.open.count += 1;
    summary.open.total += payable.amount;
    if (status === "overdue") {
      summary.overdue.count += 1;
      summary.overdue.total += payable.amount;
    } else if (status === "today") {
      summary.today.count += 1;
      summary.today.total += payable.amount;
    } else if (payable.dueDate <= weekEnd) {
      summary.nextWeek.count += 1;
      summary.nextWeek.total += payable.amount;
    }
  }

  for (const bucket of Object.values(summary)) bucket.total = round2(bucket.total);
  return summary;
}

// ---------- fluxo de caixa ----------

export type DatedAmount = { date: string; amount: number };

export type MonthFlow = { month: string; income: number; expense: number; balance: number };

/** Entradas e saídas por mês (pela data em que o dinheiro entrou/saiu), nos meses pedidos. */
export function monthlyCashFlow(incomes: DatedAmount[], expenses: DatedAmount[], months: string[]): MonthFlow[] {
  return months.map((month) => {
    const income = incomes.filter((item) => monthKey(item.date) === month).reduce((sum, item) => sum + item.amount, 0);
    const expense = expenses.filter((item) => monthKey(item.date) === month).reduce((sum, item) => sum + item.amount, 0);
    return { month, income: round2(income), expense: round2(expense), balance: round2(income - expense) };
  });
}

/**
 * Saldo do caixa até `today` (inclusive): saldo inicial + entradas - saídas. Só entram os
 * movimentos a partir da data do saldo inicial (o saldo inicial já contém o que veio antes);
 * sem data, entra tudo.
 */
export function cashBalance(
  opening: { amount: number; date: string | null },
  incomes: DatedAmount[],
  expenses: DatedAmount[],
  today: string,
): number {
  const counts = (item: DatedAmount) => item.date <= today && (!opening.date || item.date >= opening.date);
  const income = incomes.filter(counts).reduce((sum, item) => sum + item.amount, 0);
  const expense = expenses.filter(counts).reduce((sum, item) => sum + item.amount, 0);
  return round2(opening.amount + income - expense);
}

export type Receivable = { date: string | null; amount: number };

export type ProjectionStep = {
  days: number;
  /** A receber até o fim do prazo (inclui o que já passou da data e ainda não entrou). */
  inflow: number;
  /** A pagar até o fim do prazo (inclui contas vencidas). */
  outflow: number;
  /** Saldo de hoje + a receber - a pagar. */
  balance: number;
};

export type CashProjection = {
  steps: ProjectionStep[];
  /** A receber sem data prevista: não entra nas projeções, só é avisado. */
  undatedReceivable: number;
};

/**
 * Quanto o caixa teria daqui a 30/60/90 dias se tudo que está previsto acontecesse na data:
 * pedidos a receber (pela data de entrega combinada) e contas em aberto (pelo vencimento).
 * Itens com data já passada ainda não aconteceram, então entram em todos os prazos.
 */
export function projectCash(input: {
  balance: number;
  receivables: Receivable[];
  payables: { dueDate: string; amount: number }[];
  today: string;
  horizons?: number[];
}): CashProjection {
  const horizons = input.horizons ?? [30, 60, 90];
  const dated = input.receivables.filter((item): item is { date: string; amount: number } => item.date !== null);
  const undatedReceivable = round2(input.receivables.filter((item) => item.date === null).reduce((sum, item) => sum + item.amount, 0));

  const steps = horizons.map((days) => {
    const end = addDays(input.today, days);
    const inflow = round2(dated.filter((item) => item.date <= end).reduce((sum, item) => sum + item.amount, 0));
    const outflow = round2(input.payables.filter((item) => item.dueDate <= end).reduce((sum, item) => sum + item.amount, 0));
    return { days, inflow, outflow, balance: round2(input.balance + inflow - outflow) };
  });

  return { steps, undatedReceivable };
}

/** Soma `months` meses a uma data "AAAA-MM-DD"; se o dia não existir no mês de destino, vai para o último dia. */
export function addMonths(iso: string, months: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1 + months, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

/** Divide um total em parcelas mensais; a última leva a diferença do arredondamento (a soma fecha no total). */
export function splitInstallments(total: number, count: number, firstDue: string): { dueDate: string; amount: number }[] {
  const base = Math.round((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, index) => ({
    dueDate: addMonths(firstDue, index),
    amount: index === count - 1 ? Math.round((total - base * (count - 1)) * 100) / 100 : base,
  }));
}

// ---------- período do fluxo de caixa ----------

export const CASH_PERIODS = ["month", "last-month", "30d", "90d", "year"] as const;
export type CashPeriod = (typeof CASH_PERIODS)[number] | "custom";

export const CASH_PERIOD_LABEL: Record<CashPeriod, string> = {
  month: "Este mês",
  "last-month": "Mês passado",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  year: "Este ano",
  custom: "Datas escolhidas",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCashPeriod(value: string | undefined): CashPeriod {
  return value === "custom" || (CASH_PERIODS as readonly string[]).includes(value ?? "") ? (value as CashPeriod) : "month";
}

/** Primeiro e último dia (inclusive) do período; "datas escolhidas" sem datas válidas cai em "este mês". */
export function resolveCashPeriod(
  period: CashPeriod,
  today: string,
  custom?: { from?: string; to?: string },
): { period: CashPeriod; from: string; to: string } {
  const firstOfMonth = `${monthKey(today)}-01`;

  switch (period) {
    case "last-month": {
      const from = addMonths(firstOfMonth, -1);
      return { period, from, to: addDays(firstOfMonth, -1) };
    }
    case "30d":
      return { period, from: addDays(today, -29), to: today };
    case "90d":
      return { period, from: addDays(today, -89), to: today };
    case "year":
      return { period, from: `${today.slice(0, 4)}-01-01`, to: today };
    case "custom": {
      if (custom?.from && custom?.to && ISO_DATE.test(custom.from) && ISO_DATE.test(custom.to)) {
        const [from, to] = custom.from <= custom.to ? [custom.from, custom.to] : [custom.to, custom.from];
        return { period, from, to };
      }
      return { period: "month", from: firstOfMonth, to: today };
    }
    default:
      return { period: "month", from: firstOfMonth, to: today };
  }
}

export type Movement = { date: string; amount: number; label: string; href?: string; direction: "in" | "out" };

type LabeledAmount = DatedAmount & { label?: string; href?: string };

/** Entradas e saídas do período misturadas numa lista só, da mais recente para a mais antiga. */
export function periodMovements(incomes: LabeledAmount[], expenses: LabeledAmount[], from: string, to: string): Movement[] {
  const inRange = (item: DatedAmount) => item.date >= from && item.date <= to;
  const toMovement = (direction: "in" | "out") => (item: LabeledAmount): Movement => ({
    date: item.date,
    amount: item.amount,
    label: item.label ?? (direction === "in" ? "Entrada" : "Pagamento"),
    href: item.href,
    direction,
  });

  return [...incomes.filter(inRange).map(toMovement("in")), ...expenses.filter(inRange).map(toMovement("out"))].sort((a, b) =>
    a.date === b.date ? a.label.localeCompare(b.label, "pt-BR") : b.date.localeCompare(a.date),
  );
}

export function sumAmounts(items: { amount: number }[]): number {
  return round2(items.reduce((sum, item) => sum + item.amount, 0));
}
