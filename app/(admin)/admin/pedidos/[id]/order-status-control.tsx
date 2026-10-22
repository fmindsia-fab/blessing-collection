"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/lib/orders/actions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/lib/orders/labels";
import type { OrderStatus } from "@/types/database.types";

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div role="group" aria-label="Situação do pedido" className="flex flex-wrap gap-2">
      {ORDER_STATUS_ORDER.map((option) => (
        <button
          key={option}
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => updateOrderStatus(orderId, option))}
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
  );
}
