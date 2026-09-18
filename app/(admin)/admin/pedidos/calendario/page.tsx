import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listOrdersForMonth } from "@/lib/orders/queries";
import { ORDER_STATUS_LABEL } from "@/lib/orders/labels";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// Segunda como primeiro dia da semana (padrão BR); getDay() começa no domingo.
function firstWeekdayOffset(year: number, month: number) {
  const weekday = new Date(year, month - 1, 1).getDay();
  return (weekday + 6) % 7;
}

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
          <div className="flex items-center gap-4 text-sm">
            <Link
              href={`/admin/pedidos/calendario?ano=${prevMonth.year}&mes=${prevMonth.month}`}
              className="underline underline-offset-4 hover:no-underline"
            >
              ← Mês anterior
            </Link>
            <Link
              href={`/admin/pedidos/calendario?ano=${nextMonth.year}&mes=${nextMonth.month}`}
              className="underline underline-offset-4 hover:no-underline"
            >
              Próximo mês →
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[var(--radius-image)] border border-border bg-border text-xs">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
          <div key={label} className="bg-secondary/60 p-2 text-center uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </div>
        ))}
        {cells.map((day, index) => (
          <div key={index} className="min-h-24 bg-background p-2">
            {day ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{day}</span>
                {(ordersByDay.get(day) ?? []).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/pedidos/${order.id}`}
                    className="truncate rounded bg-secondary px-1.5 py-1 text-[0.6875rem] outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                    title={`${order.customer?.name ?? "Cliente"} — ${ORDER_STATUS_LABEL[order.status]}`}
                  >
                    {order.customer?.name ?? "Cliente"}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
