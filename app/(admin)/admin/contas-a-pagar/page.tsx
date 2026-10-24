import Link from "next/link";
import { AlarmClockIcon, CalendarClockIcon, HandCoinsIcon, WalletIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listPayables, todayInStoreZone, type PayableRow } from "@/lib/finance/queries";
import { payableCategoryLabel, payableStatus, summarizePayables } from "@/lib/finance/calc";
import { formatDateBR, formatMoney } from "@/lib/stock/format";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { StatusPill } from "@/components/admin/status-pill";
import { ActionLink } from "@/components/ui/action";
import { cn } from "@/lib/utils";
import { PayableActions } from "./payable-actions";

function PayableItem({ payable, today }: { payable: PayableRow; today: string }) {
  const status = payableStatus(payable, today);

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 shadow-sm",
        status === "overdue" ? "border-destructive/50" : "border-border",
      )}
    >
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <span className="break-words text-base font-semibold">{payable.description}</span>
        <span className="text-sm text-muted-foreground">
          {payableCategoryLabel(payable.category)}
          {payable.supplier ? ` · ${payable.supplier}` : ""}
          {payable.recurrence === "monthly" ? " · Todo mês" : ""}
          {payable.purchaseId ? " · " : ""}
          {payable.purchaseId ? (
            <Link href={`/admin/compras/${payable.purchaseId}`} className="underline underline-offset-4">
              Ver compra
            </Link>
          ) : null}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-sm">
          {status === "paid" ? (
            <StatusPill tone="positive">Paga em {formatDateBR(payable.paidAt ?? payable.dueDate)}</StatusPill>
          ) : status === "overdue" ? (
            <StatusPill tone="accent" className="border-destructive/50 text-destructive">
              Venceu em {formatDateBR(payable.dueDate)}
            </StatusPill>
          ) : status === "today" ? (
            <StatusPill tone="accent">Vence hoje</StatusPill>
          ) : (
            <StatusPill tone="neutral">Vence em {formatDateBR(payable.dueDate)}</StatusPill>
          )}
        </span>
      </div>
      <span className="text-lg font-semibold tabular-nums">{formatMoney(payable.amount)}</span>
      <PayableActions payableId={payable.id} isPaid={status === "paid"} description={payable.description} />
    </li>
  );
}

export default async function PayablesPage() {
  const store = await getActiveStore();
  const today = todayInStoreZone();
  const { open, paid } = await listPayables(store.id, today);
  const summary = summarizePayables(open, today);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeading
        kicker="Financeiro"
        title="Contas a pagar"
        description="O que você precisa pagar e quando vence: insumos, embalagem, frete, taxas e o que mais tiver."
        action={
          <ActionLink href="/admin/contas-a-pagar/nova" variant="solid" className="h-11 px-6" data-help="new-payable">
            Nova conta
          </ActionLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Vencidas"
          value={formatMoney(summary.overdue.total)}
          icon={AlarmClockIcon}
          hint={summary.overdue.count === 0 ? "Nenhuma conta atrasada." : `${summary.overdue.count} ${summary.overdue.count === 1 ? "conta" : "contas"} para pagar já.`}
        />
        <StatCard
          label="Vencem hoje"
          value={formatMoney(summary.today.total)}
          icon={CalendarClockIcon}
          hint={summary.today.count === 0 ? "Nada vence hoje." : `${summary.today.count} ${summary.today.count === 1 ? "conta" : "contas"}.`}
        />
        <StatCard
          label="Próximos 7 dias"
          value={formatMoney(summary.nextWeek.total)}
          icon={WalletIcon}
          hint={summary.nextWeek.count === 0 ? "Nada vence na semana." : `${summary.nextWeek.count} ${summary.nextWeek.count === 1 ? "conta" : "contas"}.`}
        />
      </div>

      <PageSection id="abertas" title="Em aberto">
        {open.length === 0 ? (
          <EmptyState
            icon={HandCoinsIcon}
            action={
              <ActionLink href="/admin/contas-a-pagar/nova" variant="outline" className="h-11 px-6">
                Lançar uma conta
              </ActionLink>
            }
          >
            Nenhuma conta em aberto. Lance as contas fixas (embalagem, taxas, divulgação) para ser avisada antes de vencer.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((payable) => (
              <PayableItem key={payable.id} payable={payable} today={today} />
            ))}
          </ul>
        )}
      </PageSection>

      {paid.length > 0 ? (
        <PageSection id="pagas" title="Pagas nos últimos 60 dias">
          <ul className="flex flex-col gap-3">
            {paid.map((payable) => (
              <PayableItem key={payable.id} payable={payable} today={today} />
            ))}
          </ul>
        </PageSection>
      ) : null}
    </div>
  );
}
