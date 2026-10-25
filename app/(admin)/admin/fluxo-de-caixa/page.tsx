import { ArrowDownToLineIcon, ArrowUpFromLineIcon, BanknoteIcon, LandmarkIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getCashFlowData, todayInStoreZone } from "@/lib/finance/queries";
import { cashBalance, lastMonths, monthKey, monthlyCashFlow, projectCash } from "@/lib/finance/calc";
import { formatMoney } from "@/lib/stock/format";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { StatCard } from "@/components/admin/stat-card";
import { cn } from "@/lib/utils";
import { CashIncomeForm, CashIncomeList, OpeningBalanceForm } from "./cash-forms";

const MONTH_NAMES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

export default async function CashFlowPage() {
  const store = await getActiveStore();
  const today = todayInStoreZone();
  const data = await getCashFlowData(store.id);

  const balance = cashBalance(data.opening, data.incomes, data.expenses, today);
  const months = monthlyCashFlow(data.incomes, data.expenses, lastMonths(today, 6)).reverse();
  const thisMonth = months.find((row) => row.month === monthKey(today));
  const projection = projectCash({ balance, receivables: data.receivables, payables: data.openPayables, today });

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeading
        kicker="Financeiro"
        title="Fluxo de caixa"
        description="O dinheiro que entrou e saiu, mês a mês, e como o caixa deve ficar nos próximos meses."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo no caixa"
          value={formatMoney(balance)}
          icon={LandmarkIcon}
          hint={data.opening.date ? undefined : "Informe o saldo inicial abaixo para o número ficar certo."}
        />
        <StatCard label="Entrou neste mês" value={formatMoney(thisMonth?.income ?? 0)} icon={ArrowDownToLineIcon} />
        <StatCard label="Saiu neste mês" value={formatMoney(thisMonth?.expense ?? 0)} icon={ArrowUpFromLineIcon} />
      </div>

      <PageSection id="meses" title="Mês a mês">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">Mês</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Entrou</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Saiu</th>
                <th scope="col" className="py-2 text-right font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {months.map((row) => (
                <tr key={row.month} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="py-3 pr-4 font-medium first-letter:uppercase">{monthLabel(row.month)}</th>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(row.income)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(row.expense)}</td>
                  <td className={cn("py-3 text-right font-semibold tabular-nums", row.balance < 0 && "text-destructive")}>
                    {formatMoney(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Entra o sinal e o saldo dos pedidos pelo dia em que você marcou como recebido, mais as entradas anotadas
          abaixo. Sai o que foi marcado como pago em Contas a pagar. Os valores são brutos, sem descontar taxas de
          maquininha.
        </p>
      </PageSection>

      <PageSection id="projecao" title="Como o caixa deve ficar">
        <div className="grid gap-4 sm:grid-cols-3">
          {projection.steps.map((step) => (
            <div key={step.days} className="flex flex-col gap-2 rounded-2xl bg-secondary/50 p-4">
              <span className="text-sm font-medium text-muted-foreground">Em {step.days} dias</span>
              <span className={cn("text-2xl font-semibold tabular-nums", step.balance < 0 && "text-destructive")}>
                {formatMoney(step.balance)}
              </span>
              <span className="text-sm text-muted-foreground">
                + {formatMoney(step.inflow)} a receber
                <br />- {formatMoney(step.outflow)} a pagar
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Conta o que ainda falta receber dos pedidos (na data de entrega combinada) e as contas em aberto (no
          vencimento). O que já passou da data e não entrou ainda conta em todos os prazos.
          {projection.undatedReceivable > 0
            ? ` Há ${formatMoney(projection.undatedReceivable)} a receber de pedidos sem data de entrega, que não entram na conta.`
            : ""}
        </p>
      </PageSection>

      <PageSection id="entradas" title="Outras entradas">
        <p className="mb-5 text-sm text-muted-foreground">
          Dinheiro que não veio de um pedido do sistema (venda na feira, presente, empréstimo). Os pedidos já entram sozinhos.
        </p>
        <div className="flex flex-col gap-6">
          <CashIncomeForm today={today} />
          <CashIncomeList incomes={data.otherIncomes} />
        </div>
      </PageSection>

      <PageSection id="saldo-inicial" title="Saldo inicial">
        <p className="mb-5 flex items-start gap-2 text-sm text-muted-foreground">
          <BanknoteIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Diga quanto você tinha no caixa numa data. A partir dela o sistema soma o que entra e subtrai o que sai.
        </p>
        <OpeningBalanceForm amount={data.opening.amount} date={data.opening.date} today={today} />
      </PageSection>
    </div>
  );
}
