import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listOrdersForMonth } from "@/lib/orders/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { ActionLink } from "@/components/ui/action";
import { OrderCalendarEntry } from "./order-calendar-entry";

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

  // Dias com entrega, em ordem, para a agenda do celular.
  const agendaDays = Array.from(ordersByDay.entries()).sort((a, b) => a[0] - b[0]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = now.getDate();

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/admin/pedidos">Pedidos</BackLink>
      <PageHeading
        kicker="Encomendas"
        title={`${MONTH_NAMES[month - 1]} ${year}`}
        description="Pedidos por previsão de entrega"
        action={
          <div className="flex flex-wrap items-center gap-2">
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

      {/* Celular: agenda em lista, só com os dias que têm entrega (a grade de 7 colunas não cabe). */}
      <div className="flex flex-col gap-3 sm:hidden">
        {agendaDays.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Nenhuma entrega prevista neste mês.
          </p>
        ) : (
          agendaDays.map(([day, dayOrders]) => (
            <section key={day} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-sm tabular-nums ${
                    isCurrentMonth && day === todayDay
                      ? "bg-[var(--gold)] text-primary-foreground"
                      : "bg-[var(--brand-soft)] text-[var(--gold)]"
                  }`}
                >
                  {day}
                </span>
                <span className="capitalize">
                  {new Date(year, month - 1, day).toLocaleDateString("pt-BR", { weekday: "long" })}
                </span>
              </h2>
              <div className="flex flex-col gap-1.5">
                {dayOrders.map((order) => (
                  <OrderCalendarEntry
                    key={order.id}
                    orderId={order.id}
                    customerName={order.customer?.name ?? "Cliente"}
                    itemsSummaryLabel={order.itemsSummary.label}
                    status={order.status}
                    expectedDeliveryDate={order.expected_delivery_date}
                    statusDotClassName={STATUS_DOT[order.status] ?? "bg-muted-foreground"}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border shadow-sm sm:block">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="p-2.5 text-center text-xs font-medium text-muted-foreground"
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
                          ? "bg-[var(--gold)] font-semibold text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>

                    <div className="flex flex-col gap-1">
                      {dayOrders.map((order) => (
                        <OrderCalendarEntry
                          key={order.id}
                          orderId={order.id}
                          customerName={order.customer?.name ?? "Cliente"}
                          itemsSummaryLabel={order.itemsSummary.label}
                          status={order.status}
                          expectedDeliveryDate={order.expected_delivery_date}
                          statusDotClassName={STATUS_DOT[order.status] ?? "bg-muted-foreground"}
                        />
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
