import Link from "next/link";
import { ORDER_STATUS_LABEL, formatOrderDate } from "@/lib/orders/labels";
import type { OrderListRow } from "@/lib/orders/queries";

// Alerta de atraso (único extra de boas práticas aprovado pelo usuário no
// M12): pedidos em aberto cuja previsão de entrega já passou.
export function OverdueBanner({ orders }: { orders: OrderListRow[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-destructive/40 bg-destructive/5 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-destructive">
        {orders.length === 1 ? "1 pedido atrasado" : `${orders.length} pedidos atrasados`}
      </p>
      <ul className="flex flex-col gap-2">
        {orders.map((order) => (
          <li key={order.id} className="flex items-center justify-between gap-4 text-sm">
            <Link href={`/admin/pedidos/${order.id}`} className="underline underline-offset-4 hover:no-underline">
              {order.customer?.name ?? "Cliente"} — {ORDER_STATUS_LABEL[order.status]}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground">
              previsto para {formatOrderDate(order.expected_delivery_date)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
