"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { updateOrderStatus } from "@/lib/orders/actions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER, formatBRL, formatOrderDate } from "@/lib/orders/labels";
import type { OrderListRow } from "@/lib/orders/queries";
import type { OrderStatus } from "@/types/database.types";

/**
 * Kanban por status, arraste nativo (HTML Drag and Drop API) — mesmo padrão
 * de app/(admin)/admin/produtos/sortable-list.tsx: sem biblioteca, já que é
 * um único nível de colunas fixas, sem reordenar dentro da coluna.
 *
 * O servidor é a fonte da verdade (mesmo princípio do sortable-list): a
 * coluna muda otimisticamente ao soltar, e volta à posição do servidor se a
 * Server Action falhar.
 */
export function OrdersKanban({ orders }: { orders: OrderListRow[] }) {
  const [localOrders, setLocalOrders] = useState(orders);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<OrderStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const signature = orders.map((o) => `${o.id}:${o.status}`).join("|");
  const [syncedWith, setSyncedWith] = useState(signature);
  if (signature !== syncedWith && !draggingId) {
    setSyncedWith(signature);
    setLocalOrders(orders);
  }

  function moveOrder(orderId: string, status: OrderStatus) {
    const order = localOrders.find((o) => o.id === orderId);
    if (!order || order.status === status) return;

    // Move otimisticamente; revalidatePath (dentro de updateOrderStatus)
    // reconcilia com o servidor no próximo render, mesmo padrão do
    // sortable-list.tsx de produtos.
    setLocalOrders((current) => current.map((o) => (o.id === orderId ? { ...o, status } : o)));
    startTransition(() => updateOrderStatus(orderId, status));
  }

  return (
    <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-4 lg:-mx-10 lg:px-10">
      {ORDER_STATUS_ORDER.map((status) => {
        const columnOrders = localOrders.filter((o) => o.status === status);

        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStatus(status);
            }}
            onDragLeave={() => setOverStatus((current) => (current === status ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingId) moveOrder(draggingId, status);
              setOverStatus(null);
            }}
            className={`flex w-72 shrink-0 flex-col gap-3 rounded-[var(--radius-image)] border p-3 transition-colors ${
              overStatus === status ? "border-[var(--gold)] bg-secondary/40" : "border-border bg-secondary/15"
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {ORDER_STATUS_LABEL[status]}
              </span>
              <span className="text-xs text-muted-foreground">{columnOrders.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {columnOrders.map((order) => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", order.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(order.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverStatus(null);
                  }}
                  className={`group flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-background p-3 shadow-sm transition-opacity ${
                    draggingId === order.id ? "opacity-40" : ""
                  } ${isPending ? "pointer-events-none" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
                    >
                      {order.customer?.name ?? "Cliente"}
                    </Link>

                    {status === "quote" ? (
                      <Link
                        href={`/admin/pedidos/${order.id}/editar`}
                        aria-label="Editar pedido"
                        className="shrink-0 rounded-full p-1 text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                      >
                        <PencilIcon className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {formatOrderDate(order.order_date)}
                    {order.expected_delivery_date ? ` · entrega ${formatOrderDate(order.expected_delivery_date)}` : ""}
                  </span>

                  <span className="text-sm tabular-nums">{formatBRL(order.total_amount)}</span>
                </div>
              ))}

              {columnOrders.length === 0 ? (
                <p className="rounded-[var(--radius)] border border-dashed border-border/60 py-4 text-center text-[0.6875rem] text-muted-foreground">
                  Vazio
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
