import Link from "next/link";
import { BellRingIcon, HandCoinsIcon, WarehouseIcon } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { formatMoney } from "@/lib/stock/format";

export type TodayCardsData = {
  /** Contas vencidas e as que vencem hoje. */
  payables: { overdueCount: number; todayCount: number; total: number };
  /** Materiais controlados que acabaram, estão acabando ou ficaram negativos. */
  lowStockCount: number;
  /** Contatos do funil para retornar hoje ou com retorno atrasado. */
  followups: { todayCount: number; overdueCount: number };
};

// "Hoje no seu ateliê": só aparecem os cartões que têm algo a fazer; sem nada pendente a faixa some.
export function TodayCards({ data }: { data: TodayCardsData }) {
  const payableCount = data.payables.overdueCount + data.payables.todayCount;
  const followupCount = data.followups.todayCount + data.followups.overdueCount;

  if (payableCount === 0 && data.lowStockCount === 0 && followupCount === 0) return null;

  return (
    <section aria-label="Hoje no seu ateliê" className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">Hoje no seu ateliê</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {payableCount > 0 ? (
          <Link href="/admin/contas-a-pagar" className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">
            <StatCard
              icon={HandCoinsIcon}
              label="Contas para pagar"
              value={formatMoney(data.payables.total)}
              hint={`${data.payables.overdueCount} vencidas · ${data.payables.todayCount} vencem hoje`}
            />
          </Link>
        ) : null}
        {data.lowStockCount > 0 ? (
          <Link href="/admin/estoque" className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">
            <StatCard
              icon={WarehouseIcon}
              label="Materiais acabando"
              value={String(data.lowStockCount)}
              hint={data.lowStockCount === 1 ? "material no mínimo, zerado ou negativo" : "materiais no mínimo, zerados ou negativos"}
            />
          </Link>
        ) : null}
        {followupCount > 0 ? (
          <Link href="/admin/funil" className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">
            <StatCard
              icon={BellRingIcon}
              label="Retornos do funil"
              value={String(followupCount)}
              hint={`${data.followups.todayCount} hoje · ${data.followups.overdueCount} atrasados`}
            />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
