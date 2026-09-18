"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER, formatBRL, formatOrderDate } from "@/lib/orders/labels";
import type { OrderListRow } from "@/lib/orders/queries";
import type { OrderStatus } from "@/types/database.types";
import { Input } from "@/components/ui/input";

export function OrdersList({ orders }: { orders: OrderListRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (term && !order.customer?.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente…"
          aria-label="Buscar pedidos por cliente"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.08em] transition-colors ${
              statusFilter === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {ORDER_STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.08em] transition-colors ${
                statusFilter === status
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {ORDER_STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Nenhum pedido encontrado.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/admin/pedidos/${order.id}`}
              className="flex flex-col gap-1 py-4 outline-none transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{order.customer?.name ?? "Cliente"}</span>
                <span className="text-xs text-muted-foreground">
                  Pedido em {formatOrderDate(order.order_date)}
                  {order.expected_delivery_date
                    ? ` · previsto para ${formatOrderDate(order.expected_delivery_date)}`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {ORDER_STATUS_LABEL[order.status]}
                </span>
                <span className="text-sm tabular-nums">{formatBRL(order.total_amount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
