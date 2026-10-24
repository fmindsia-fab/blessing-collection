"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, type OrderStatusResult } from "@/lib/orders/actions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/lib/orders/labels";
import { StockNotice } from "@/components/admin/stock-notice";
import type { OrderStatus } from "@/types/database.types";

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<OrderStatusResult | null>(null);

  // "Cancelado" só aparece quando é a situação atual: cancelar tem botão próprio logo abaixo, que
  // confirma e, se o pedido já descontou materiais, pergunta se eles voltam ao estoque.
  const options = ORDER_STATUS_ORDER.filter((option) => option !== "cancelled" || status === "cancelled");

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Situação do pedido" className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={isPending}
            onClick={() => {
              setNotice(null);
              startTransition(async () => {
                setNotice(await updateOrderStatus(orderId, option));
              });
            }}
            aria-pressed={status === option}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              status === option
                ? "border-[var(--gold)] bg-[var(--gold)] text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-[var(--gold)] hover:text-foreground"
            }`}
          >
            {ORDER_STATUS_LABEL[option]}
          </button>
        ))}
      </div>
      <StockNotice result={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
