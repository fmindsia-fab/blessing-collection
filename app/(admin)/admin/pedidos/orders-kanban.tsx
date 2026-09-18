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
  // Card que acabou de trocar de coluna: recebe a animação de entrada por um
  // instante só, depois volta ao normal (senão reanimaria a cada revalidação).
  const [justMovedId, setJustMovedId] = useState<string | null>(null);
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
    setJustMovedId(orderId);
    window.setTimeout(() => setJustMovedId((current) => (current === orderId ? null : current)), 320);
    startTransition(() => updateOrderStatus(orderId, status));
  }

  return (
    <div className="-mx-6 flex gap-5 overflow-x-auto px-6 pb-4 lg:-mx-10 lg:px-10">
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
            className={`flex w-72 shrink-0 flex-col gap-3 rounded-[var(--radius-image)] border-2 border-dashed p-3 transition-all duration-200 ${
              overStatus === status
                ? "scale-[1.02] border-[var(--gold)] bg-[var(--gold)]/8 shadow-md"
                : "border-transparent bg-secondary/25"
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                {ORDER_STATUS_LABEL[status]}
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[0.625rem] font-medium tabular-nums text-muted-foreground">
                {columnOrders.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
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
                  className={`group flex cursor-grab flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3.5 shadow-sm transition-all duration-200 ease-out active:cursor-grabbing ${
                    draggingId === order.id
                      ? "rotate-2 scale-105 opacity-50 shadow-lg"
                      : "hover:-translate-y-0.5 hover:shadow-md"
                  } ${justMovedId === order.id ? "animate-[kanban-pop_0.32s_ease-out]" : ""} ${
                    isPending ? "pointer-events-none" : ""
                  }`}
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

                  <span className="text-sm font-medium tabular-nums">{formatBRL(order.total_amount)}</span>
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
