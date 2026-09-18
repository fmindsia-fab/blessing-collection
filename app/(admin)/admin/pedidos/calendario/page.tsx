import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listOrdersForMonth } from "@/lib/orders/queries";
import { ORDER_STATUS_LABEL } from "@/lib/orders/labels";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { ActionLink } from "@/components/ui/action";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// Segunda como primeiro dia da semana (padrão BR); getDay() começa no domingo.
function firstWeekdayOffset(year: number, month: number) {
  const weekday = new Date(year, month - 1, 1).getDay();
  return (weekday + 6) % 7;
}

// Cor sutil por status, só o suficiente para diferenciar de relance sem
// competir com a paleta editorial (nenhuma cor de terceiro, tons neutros).
const STATUS_DOT: Record<string, string> = {
  quote: "bg-muted-foreground/50",
  confirmed: "bg-[var(--gold)]",
  in_production: "bg-[var(--gold)]",
  ready: "bg-foreground",
  delivered: "bg-muted-foreground/30",
  cancelled: "bg-destructive/50",
};

export default async function OrdersCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.ano) || now.getFullYear();
  const month = Number(params.mes) || now.getMonth() + 1;

  const store = await getActiveStore();
  const orders = await listOrdersForMonth(store.id, year, month);

  const ordersByDay = new Map<number, typeof orders>();
  for (const order of orders) {
    if (!order.expected_delivery_date) continue;
    const day = Number(order.expected_delivery_date.split("-")[2]);
    const list = ordersByDay.get(day) ?? [];
    list.push(order);
    ordersByDay.set(day, list);
  }

  const totalDays = daysInMonth(year, month);
  const offset = firstWeekdayOffset(year, month);
  const cells = [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  // Preenche a última semana para a grade fechar em múltiplos de 7.
  while (cells.length % 7 !== 0) cells.push(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = now.getDate();

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/admin/pedidos">Pedidos</BackLink>
      <PageHeading
        kicker="Encomendas"
        title={`${MONTH_NAMES[month - 1]} ${year}`}
        description="Pedidos por previsão de entrega"
        action={
          <div className="flex items-center gap-2">
            <ActionLink
              href={`/admin/pedidos/calendario?ano=${prevMonth.year}&mes=${prevMonth.month}`}
              variant="outline"
              className="h-9 gap-1.5 px-4"
            >
              <ChevronLeftIcon className="size-3.5" />
              Anterior
            </ActionLink>
            {!isCurrentMonth ? (
              <ActionLink
                href={`/admin/pedidos/calendario?ano=${now.getFullYear()}&mes=${now.getMonth() + 1}`}
                variant="ghost"
                className="h-9 px-3"
              >
                Hoje
              </ActionLink>
            ) : null}
            <ActionLink
              href={`/admin/pedidos/calendario?ano=${nextMonth.year}&mes=${nextMonth.month}`}
              variant="outline"
              className="h-9 gap-1.5 px-4"
            >
              Próximo
              <ChevronRightIcon className="size-3.5" />
            </ActionLink>
          </div>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-image)] border border-border shadow-sm">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="p-2.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            const isToday = isCurrentMonth && day === todayDay;
            const dayOrders = day ? (ordersByDay.get(day) ?? []) : [];

            return (
              <div
                key={index}
                className={`flex min-h-28 flex-col gap-1.5 border-b border-r border-border/60 p-2 transition-colors [&:nth-child(7n)]:border-r-0 ${
                  day ? "bg-background hover:bg-secondary/20" : "bg-secondary/10"
                }`}
              >
                {day ? (
                  <>
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${
                        isToday
                          ? "bg-[var(--gold)] font-semibold text-background"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>

                    <div className="flex flex-col gap-1">
                      {dayOrders.map((order) => (
                        <Link
                          key={order.id}
                          href={`/admin/pedidos/${order.id}`}
                          className="group flex flex-col gap-0.5 rounded-[var(--radius)] border border-border/60 bg-secondary/30 px-2 py-1.5 outline-none transition-colors hover:border-[var(--gold)] hover:bg-secondary/60 focus-visible:border-[var(--gold)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]"
                          title={ORDER_STATUS_LABEL[order.status]}
                        >
                          <span className="flex items-center gap-1.5">
                            <span
                              aria-hidden
                              className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[order.status] ?? "bg-muted-foreground"}`}
                            />
                            <span className="truncate text-[0.6875rem] font-medium underline-offset-2 group-hover:underline">
                              {order.customer?.name ?? "Cliente"}
                            </span>
                          </span>
                          <span className="truncate pl-3 text-[0.625rem] text-muted-foreground">
                            {order.itemsSummary.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
