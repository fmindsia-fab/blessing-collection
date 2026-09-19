import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import {
  getOrderDashboardData,
  getMaterialsToBuy,
  parseOrderDashboardPeriod,
  ORDER_DASHBOARD_PERIODS,
  ORDER_DASHBOARD_PERIOD_LABEL,
} from "@/lib/orders/dashboard-queries";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER, formatBRL } from "@/lib/orders/labels";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { PeriodFilter } from "@/components/admin/period-filter";
import { StatCard } from "@/components/admin/stat-card";

export default async function OrdersDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const period = parseOrderDashboardPeriod(periodo);

  const store = await getActiveStore();
  const [data, materialsToBuy] = await Promise.all([
    getOrderDashboardData(store.id, period),
    getMaterialsToBuy(store.id),
  ]);

  const { financial, statusBreakdown, overdueCount, overdueAmount, topProducts, topCustomers, totalOrders } = data;

  const statusMap = new Map(statusBreakdown.map((s) => [s.status, s]));

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/admin/pedidos">Pedidos</BackLink>

      <div className="flex flex-col gap-5">
        <PageHeading
          kicker="Encomendas"
          title="Dashboard de pedidos"
          description={`Indicadores financeiros e gerenciais — ${ORDER_DASHBOARD_PERIOD_LABEL[period].toLowerCase()}.`}
        />
        <PeriodFilter
          basePath="/admin/pedidos/dashboard"
          active={period}
          periods={ORDER_DASHBOARD_PERIODS}
          labels={ORDER_DASHBOARD_PERIOD_LABEL}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos no período" value={String(totalOrders)} hint="Não cancelados" />
        <StatCard label="Recebido" value={formatBRL(financial.received)} hint="Sinal + saldo já pagos" />
        <StatCard label="A receber" value={formatBRL(financial.pending)} hint="Pendente de pagamento" />
        <StatCard label="Ticket médio" value={formatBRL(financial.averageTicket)} />
      </div>

      {overdueCount > 0 ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-destructive/40 bg-destructive/5 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-destructive">
            {overdueCount === 1 ? "1 pedido atrasado" : `${overdueCount} pedidos atrasados`} —{" "}
            {formatBRL(overdueAmount)} em risco
          </p>
          <Link href="/admin/pedidos" className="w-fit text-xs underline underline-offset-4 hover:no-underline">
            Ver no Kanban
          </Link>
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <span className="kicker">Pedidos por status</span>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STATUS_ORDER.map((status) => {
            const entry = statusMap.get(status);
            return (
              <div key={status} className="flex flex-col gap-1 rounded-[var(--radius)] border border-border p-3">
                <span className="text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">
                  {ORDER_STATUS_LABEL[status]}
                </span>
                <span className="text-lg font-medium tabular-nums">{entry?.count ?? 0}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatBRL(entry?.totalAmount ?? 0)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <span className="kicker">Top produtos pedidos</span>
          {topProducts.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {topProducts.map((entry, index) => (
                <li key={entry.key} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 truncate text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[0.625rem] tabular-nums">
                      {index + 1}
                    </span>
                    <span className="truncate">{entry.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {entry.count}× · {formatBRL(entry.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum pedido no período.</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <span className="kicker">Top clientes</span>
          {topCustomers.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {topCustomers.map((entry, index) => (
                <li key={entry.key} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 truncate text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[0.625rem] tabular-nums">
                      {index + 1}
                    </span>
                    <span className="truncate">{entry.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {entry.count} {entry.count === 1 ? "pedido" : "pedidos"} · {formatBRL(entry.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum pedido no período.</p>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <span className="kicker">Materiais a comprar</span>
        <p className="text-xs text-muted-foreground">
          Soma dos materiais cadastrados nas peças de pedidos com status &quot;Confirmado&quot; —
          não considera período nem outros status.
        </p>
        {materialsToBuy.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {materialsToBuy.map((material) => (
              <li key={`${material.name}-${material.unit}`} className="flex items-center justify-between py-2.5 text-sm">
                <span>{material.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {material.quantity} {material.unit}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum pedido confirmado com materiais cadastrados no momento.
          </p>
        )}
      </section>
    </div>
  );
}
