import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getCashFlowData, todayInStoreZone } from "@/lib/finance/queries";
import {
  CASH_PERIODS,
  CASH_PERIOD_LABEL,
  cashBalance,
  parseCashPeriod,
  periodMovements,
  projectCash,
  resolveCashPeriod,
  sumAmounts,
} from "@/lib/finance/calc";
import { formatDateBR, formatMoney } from "@/lib/stock/format";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { PeriodFilter } from "@/components/admin/period-filter";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CashIncomeForm, CashIncomeList, OpeningBalanceForm } from "./cash-forms";

type SearchParams = { periodo?: string; de?: string; ate?: string };

export default async function CashFlowPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const store = await getActiveStore();
  const today = todayInStoreZone();
  const data = await getCashFlowData(store.id);

  const range = resolveCashPeriod(parseCashPeriod(query.periodo), today, { from: query.de, to: query.ate });
  const movements = periodMovements(data.incomes, data.expenses, range.from, range.to);
  const entered = sumAmounts(movements.filter((item) => item.direction === "in"));
  const left = sumAmounts(movements.filter((item) => item.direction === "out"));

  const balance = cashBalance(data.opening, data.incomes, data.expenses, today);
  const toReceive = sumAmounts(data.receivables);
  const toPay = sumAmounts(data.openPayables.map((item) => ({ amount: item.amount })));
  const projection = projectCash({ balance, receivables: data.receivables, payables: data.openPayables, today });

  const periods = range.period === "custom" ? ([...CASH_PERIODS, "custom"] as const) : CASH_PERIODS;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeading kicker="Financeiro" title="Fluxo de caixa" description="O dinheiro que entrou e saiu, e o que ainda vem pela frente." />

      <div className="flex flex-col gap-3">
        <PeriodFilter basePath="/admin/fluxo-de-caixa" active={range.period} periods={periods} labels={CASH_PERIOD_LABEL} />
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="periodo" value="custom" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="de">De</Label>
            <Input id="de" name="de" type="date" defaultValue={range.from} max={today} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" name="ate" type="date" defaultValue={range.to} max={today} required />
          </div>
          <Button type="submit" variant="outline" className="h-11">
            Ver período
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Mostrando de {formatDateBR(range.from)} até {formatDateBR(range.to)}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Entrou" value={formatMoney(entered)} hint="Dinheiro que você recebeu no período." />
        <StatCard label="Saiu" value={formatMoney(left)} hint="Contas que você pagou no período." />
        <StatCard label="Sobrou" value={formatMoney(sumAmounts([{ amount: entered - left }]))} hint="Entrou menos o que saiu." />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo no caixa hoje"
          value={formatMoney(balance)}
          hint={data.opening.date ? undefined : "Informe o saldo inicial (no fim da página) para ficar certo."}
        />
        <StatCard label="Falta receber" value={formatMoney(toReceive)} hint="Dos pedidos que ainda não foram pagos por inteiro." />
        <StatCard label="Falta pagar" value={formatMoney(toPay)} hint="Contas em aberto." />
      </div>

      <PageSection id="movimentos" title="O que aconteceu no período">
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma entrada ou saída nestas datas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/70">
            {movements.slice(0, 100).map((item, index) => (
              <li key={`${item.date}-${index}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="break-words text-base font-medium">
                    {item.href ? (
                      <Link href={item.href} className="underline-offset-4 hover:underline">
                        {item.label}
                      </Link>
                    ) : (
                      item.label
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatDateBR(item.date)}</span>
                </div>
                <span className={cn("text-base font-semibold tabular-nums", item.direction === "out" && "text-destructive")}>
                  {item.direction === "in" ? "+ " : "- "}
                  {formatMoney(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {movements.length > 100 ? <p className="mt-3 text-sm text-muted-foreground">Mostrando os 100 mais recentes.</p> : null}
      </PageSection>

      <PageSection id="previsao" title="Como o caixa deve ficar">
        <ul className="flex flex-col divide-y divide-border/70">
          {projection.steps.map((step) => (
            <li key={step.days} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <span className="text-base">Daqui a {step.days} dias</span>
              <span className={cn("text-lg font-semibold tabular-nums", step.balance < 0 && "text-destructive")}>
                {formatMoney(step.balance)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          É o saldo de hoje mais o que falta receber (na data de entrega do pedido) menos as contas em aberto (no
          vencimento).
          {projection.undatedReceivable > 0
            ? ` ${formatMoney(projection.undatedReceivable)} de pedidos sem data de entrega não entram nesta conta.`
            : ""}
        </p>
      </PageSection>

      <PageSection id="ajustes" title="Anotar e ajustar">
        <div className="flex flex-col gap-3">
          <details className="group rounded-2xl border border-border px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium">
              Anotar uma entrada (venda na feira, presente…)
              <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-4 flex flex-col gap-6">
              <p className="text-sm text-muted-foreground">Os pedidos já entram sozinhos; use isto só para dinheiro de fora do sistema.</p>
              <CashIncomeForm today={today} />
              <CashIncomeList incomes={data.otherIncomes} />
            </div>
          </details>

          <details className="group rounded-2xl border border-border px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium">
              Saldo inicial do caixa
              <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-4">
              <OpeningBalanceForm amount={data.opening.amount} date={data.opening.date} today={today} />
            </div>
          </details>
        </div>
      </PageSection>
    </div>
  );
}
