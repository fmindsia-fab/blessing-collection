"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/lib/orders/actions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/lib/orders/labels";
import type { OrderStatus } from "@/types/database.types";

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {ORDER_STATUS_ORDER.map((option) => (
        <button
          key={option}
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => updateOrderStatus(orderId, option))}
          className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.08em] transition-colors disabled:opacity-50 ${
            status === option
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {ORDER_STATUS_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
