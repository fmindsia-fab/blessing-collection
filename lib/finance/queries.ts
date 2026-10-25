import { createServerSupabaseClient } from "@/lib/supabase/server";
import { STORE_TIME_ZONE } from "@/lib/analytics/series";
import { addDays, type DatedAmount, type Receivable } from "./calc";

export type CashEntry = DatedAmount & { label: string; href?: string };
import type { PayableCategory } from "@/types/database.types";

/** "Hoje" no horário de Brasília (e não em UTC, que vira o dia às 21h daqui), como "AAAA-MM-DD". */
export function todayInStoreZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export type PayableRow = {
  id: string;
  description: string;
  category: PayableCategory;
  supplier: string | null;
  dueDate: string;
  amount: number;
  paidAt: string | null;
  recurrence: "none" | "monthly";
  purchaseId: string | null;
};

const PAYABLE_COLUMNS = "id, description, category, supplier, due_date, amount, paid_at, recurrence, purchase_id";

type PayableDbRow = {
  id: string;
  description: string;
  category: PayableCategory;
  supplier: string | null;
  due_date: string;
  amount: number;
  paid_at: string | null;
  recurrence: "none" | "monthly";
  purchase_id: string | null;
};

function toPayableRow(row: PayableDbRow): PayableRow {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    supplier: row.supplier,
    dueDate: row.due_date,
    amount: Number(row.amount),
    paidAt: row.paid_at,
    recurrence: row.recurrence,
    purchaseId: row.purchase_id,
  };
}

/** Contas em aberto (a mais antiga primeiro) e as pagas nos últimos 60 dias. Sempre filtrado pela loja. */
export async function listPayables(storeId: string, today: string): Promise<{ open: PayableRow[]; paid: PayableRow[] }> {
  const supabase = await createServerSupabaseClient();

  const [{ data: open }, { data: paid }] = await Promise.all([
    supabase
      .from("payables")
      .select(PAYABLE_COLUMNS)
      .eq("store_id", storeId)
      .eq("status", "active")
      .is("paid_at", null)
      .order("due_date", { ascending: true })
      .limit(500),
    supabase
      .from("payables")
      .select(PAYABLE_COLUMNS)
      .eq("store_id", storeId)
      .eq("status", "active")
      .gte("paid_at", addDays(today, -60))
      .order("paid_at", { ascending: false })
      .limit(200),
  ]);

  return { open: (open ?? []).map(toPayableRow), paid: (paid ?? []).map(toPayableRow) };
}

/** Só o necessário para os cartões de aviso (Dashboard): as contas em aberto. */
export async function listOpenPayables(storeId: string): Promise<PayableRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("payables")
    .select(PAYABLE_COLUMNS)
    .eq("store_id", storeId)
    .eq("status", "active")
    .is("paid_at", null)
    .order("due_date", { ascending: true })
    .limit(500);
  return (data ?? []).map(toPayableRow);
}

export type CashIncomeRow = { id: string; description: string; amount: number; receivedAt: string };

export type CashFlowData = {
  opening: { amount: number; date: string | null };
  /** Dinheiro que entrou: sinais e saldos de pedidos recebidos + outras entradas. */
  incomes: CashEntry[];
  /** Dinheiro que saiu: contas pagas. */
  expenses: CashEntry[];
  /** O que falta receber dos pedidos (sinal ou saldo ainda não pago), com a data de entrega combinada. */
  receivables: Receivable[];
  /** Contas em aberto, para a projeção. */
  openPayables: { dueDate: string; amount: number }[];
  /** Outras entradas lançadas à mão (mais recentes primeiro). */
  otherIncomes: CashIncomeRow[];
};

/** Tudo o que o fluxo de caixa precisa. Todas as consultas filtram por loja; RLS só deixa a dona ler. */
export async function getCashFlowData(storeId: string): Promise<CashFlowData> {
  const supabase = await createServerSupabaseClient();

  const [{ data: priv }, { data: paidOrders }, { data: openOrders }, { data: incomes }, { data: paidPayables }, { data: openPayables }] =
    await Promise.all([
      supabase.from("store_private").select("cash_opening_balance, cash_opening_date").eq("store_id", storeId).maybeSingle(),
      supabase
        .from("orders")
        .select("id, deposit_amount, deposit_paid_at, balance_amount, balance_paid_at")
        .eq("store_id", storeId)
        .or("deposit_paid_at.not.is.null,balance_paid_at.not.is.null")
        .limit(5000),
      supabase
        .from("orders")
        .select("total_amount, deposit_amount, deposit_paid_at, balance_amount, balance_paid_at, expected_delivery_date")
        .eq("store_id", storeId)
        .in("status", ["confirmed", "in_production", "ready", "delivered"])
        .limit(5000),
      supabase
        .from("cash_incomes")
        .select("id, description, amount, received_at")
        .eq("store_id", storeId)
        .eq("status", "active")
        .order("received_at", { ascending: false })
        .limit(1000),
      supabase
        .from("payables")
        .select("description, amount, paid_at, purchase_id")
        .eq("store_id", storeId)
        .eq("status", "active")
        .not("paid_at", "is", null)
        .limit(5000),
      supabase.from("payables").select("amount, due_date").eq("store_id", storeId).eq("status", "active").is("paid_at", null).limit(1000),
    ]);

  const incomeEntries: CashEntry[] = [];
  for (const order of paidOrders ?? []) {
    if (order.deposit_paid_at && Number(order.deposit_amount) > 0) {
      incomeEntries.push({ date: order.deposit_paid_at, amount: Number(order.deposit_amount), label: "Sinal de pedido", href: `/admin/pedidos/${order.id}` });
    }
    if (order.balance_paid_at && Number(order.balance_amount) > 0) {
      incomeEntries.push({ date: order.balance_paid_at, amount: Number(order.balance_amount), label: "Saldo de pedido", href: `/admin/pedidos/${order.id}` });
    }
  }
  for (const income of incomes ?? []) incomeEntries.push({ date: income.received_at, amount: Number(income.amount), label: income.description });

  // Falta receber = total do pedido - o que já foi pago (mesma conta da tela do pedido), numa linha só
  // por pedido, na data de entrega combinada.
  const receivables: Receivable[] = [];
  for (const order of openOrders ?? []) {
    const paid =
      (order.deposit_paid_at ? Number(order.deposit_amount) : 0) + (order.balance_paid_at ? Number(order.balance_amount) : 0);
    const pending = Math.round((Number(order.total_amount) - Math.min(paid, Number(order.total_amount))) * 100) / 100;
    if (pending > 0) receivables.push({ date: order.expected_delivery_date ?? null, amount: pending });
  }

  return {
    opening: { amount: Number(priv?.cash_opening_balance ?? 0), date: priv?.cash_opening_date ?? null },
    incomes: incomeEntries,
    expenses: (paidPayables ?? []).flatMap((row) => (row.paid_at ? [{ date: row.paid_at, amount: Number(row.amount), label: row.description, href: row.purchase_id ? `/admin/compras/${row.purchase_id}` : undefined }] : [])),
    receivables,
    openPayables: (openPayables ?? []).map((row) => ({ dueDate: row.due_date, amount: Number(row.amount) })),
    otherIncomes: (incomes ?? []).slice(0, 30).map((row) => ({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      receivedAt: row.received_at,
    })),
  };
}

/** Contas (não canceladas) geradas por uma compra. */
export async function listPurchasePayables(storeId: string, purchaseId: string): Promise<PayableRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("payables")
    .select(PAYABLE_COLUMNS)
    .eq("store_id", storeId)
    .eq("purchase_id", purchaseId)
    .eq("status", "active")
    .order("due_date", { ascending: true });
  return (data ?? []).map(toPayableRow);
}
