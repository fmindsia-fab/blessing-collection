"use client";

import Link from "next/link";
import { ORDER_STATUS_LABEL } from "@/lib/orders/labels";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { OrderStatus } from "@/types/database.types";

// Nome e resumo do pedido truncam na célula do calendário (espaço é
// limitado em telas pequenas) — o popup existe para mostrar o texto
// completo sem precisar navegar para a página do pedido.
export function OrderCalendarEntry({
  orderId,
  customerName,
  itemsSummaryLabel,
  status,
  expectedDeliveryDate,
  statusDotClassName,
}: {
  orderId: string;
  customerName: string;
  itemsSummaryLabel: string;
  status: OrderStatus;
  expectedDeliveryDate: string | null;
  statusDotClassName: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="group flex flex-col gap-0.5 rounded-[var(--radius)] border border-border/60 bg-secondary/30 px-2 py-1.5 text-left outline-none transition-colors hover:border-[var(--gold)] hover:bg-secondary/60 focus-visible:border-[var(--gold)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]"
          />
        }
      >
        <span className="flex items-center gap-1.5">
          <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${statusDotClassName}`} />
          <span className="truncate text-xs font-medium">{customerName}</span>
        </span>
        <span className="truncate pl-3 text-xs text-muted-foreground">{itemsSummaryLabel}</span>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>{customerName}</DialogTitle>
        <DialogDescription>{itemsSummaryLabel}</DialogDescription>

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{ORDER_STATUS_LABEL[status]}</dd>
          </div>
          {expectedDeliveryDate ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Previsão de entrega</dt>
              <dd className="font-medium">
                {new Date(`${expectedDeliveryDate}T00:00:00`).toLocaleDateString("pt-BR")}
              </dd>
            </div>
          ) : null}
        </dl>

        <Button render={<Link href={`/admin/pedidos/${orderId}`} />} className="w-full">
          Ver pedido completo
        </Button>
      </DialogContent>
    </Dialog>
  );
}
