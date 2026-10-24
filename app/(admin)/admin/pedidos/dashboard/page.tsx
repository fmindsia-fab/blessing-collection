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
import { formatQuantity } from "@/lib/stock/format";
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

  const {
    financial,
    statusBreakdown,
    overdueCount,
    overdueAmount,
    topProducts,
    topCustomers,
    totalOrders,
    pendingPayments,
  } = data;

  const statusMap = new Map(statusBreakdown.map((s) => [s.status, s]));

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/admin/pedidos">Pedidos</BackLink>

      <div className="flex flex-col gap-5">
        <PageHeading
          kicker="Encomendas"
          title="Dashboard de pedidos"
          description={`Pedidos por situação, pagamentos pendentes e materiais a comprar — ${ORDER_DASHBOARD_PERIOD_LABEL[period].toLowerCase()}.`}
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
        <StatCard
          label="A receber"
          value={formatBRL(financial.pending)}
          hint={
            pendingPayments.length > 0
              ? `${pendingPayments.length} ${pendingPayments.length === 1 ? "pedido" : "pedidos"} pendentes`
              : "Nada pendente"
          }
        />
        <StatCard label="Ticket médio" value={formatBRL(financial.averageTicket)} />
      </div>

      {overdueCount > 0 ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-destructive/40 bg-destructive/5 p-5">
          <p className="text-sm font-semibold text-destructive">
            {overdueCount === 1 ? "1 pedido atrasado" : `${overdueCount} pedidos atrasados`} —{" "}
            {formatBRL(overdueAmount)} em risco
          </p>
          <Link href="/admin/pedidos" className="w-fit text-xs underline underline-offset-4 hover:no-underline">
            Ver no Kanban
          </Link>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Pedidos por status</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STATUS_ORDER.map((status) => {
            const entry = statusMap.get(status);
            return (
              <div key={status} className="flex flex-col gap-1 rounded-[var(--radius)] border border-border p-3">
                <span className="text-xs font-medium text-muted-foreground">
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

      {pendingPayments.length > 0 ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Pagamentos pendentes</h2>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {pendingPayments.map((entry) => (
              <li key={entry.orderId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link
                  href={`/admin/pedidos/${entry.orderId}`}
                  className="truncate underline-offset-4 hover:underline"
                >
                  {entry.customerName}
                </Link>
                <span className="shrink-0 tabular-nums">{formatBRL(entry.pendingAmount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Top produtos pedidos</h2>
          {topProducts.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {topProducts.map((entry, index) => (
                <li key={entry.key} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 truncate text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-xs tabular-nums">
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

        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Top clientes</h2>
          {topCustomers.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {topCustomers.map((entry, index) => (
                <li key={entry.key} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 truncate text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-xs tabular-nums">
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

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Materiais a comprar</h2>
        <p className="text-sm text-muted-foreground">
          O que os pedidos <strong className="text-foreground">Confirmados</strong> vão precisar, menos o que você já
          tem em estoque (nos materiais com controle). Não considera período nem outras situações.
        </p>
        {materialsToBuy.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {materialsToBuy.map((material) => (
              <li
                key={`${material.name}-${material.unit}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm"
              >
                <span className="font-medium">{material.name}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums text-muted-foreground">
                  <span>
                    Precisa {formatQuantity(material.quantity)} {material.unit}
                  </span>
                  {material.stock !== null ? (
                    <span>
                      Tem {formatQuantity(Math.max(0, material.stock))} {material.unit}
                    </span>
                  ) : null}
                  <strong className={material.toBuy > 0 ? "text-foreground" : "font-medium"}>
                    {material.toBuy > 0
                      ? `Comprar ${formatQuantity(material.toBuy)} ${material.unit}`
                      : "Já tem o suficiente"}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum pedido confirmado com materiais cadastrados no momento.
          </p>
        )}
      </section>
    </div>
  );
}
