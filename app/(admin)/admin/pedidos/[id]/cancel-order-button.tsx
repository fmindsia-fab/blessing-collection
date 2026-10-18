"use client";

import { useState, useTransition } from "react";
import { cancelOrder, updateOrderStatus } from "@/lib/orders/actions";
import { Button } from "@/components/ui/button";

// Cancelar NÃO apaga: o pedido muda para "Cancelado", sai das listas de trabalho
// e das contas do painel, e o histórico fica guardado. Por isso há também como
// reabrir (volta como orçamento). A confirmação em dois cliques evita o toque
// por engano, já que o cancelamento tira o pedido da fila de produção.
export function CancelOrderButton({ orderId, cancelled }: { orderId: string; cancelled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (cancelled) {
    return (
      <section className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border p-4">
        <p className="text-sm text-muted-foreground">
          Este pedido está <strong className="text-foreground">cancelado</strong>: não aparece nas listas de
          trabalho nem nas contas do painel, mas o histórico continua guardado.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={isPending}
          onClick={() => startTransition(() => updateOrderStatus(orderId, "quote"))}
        >
          {isPending ? "Reabrindo..." : "Reabrir como orçamento"}
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Cancelar tira o pedido das listas de trabalho e das contas do painel. O histórico fica guardado e dá
        para reabrir depois.
      </p>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await cancelOrder(orderId);
                setConfirming(false);
              })
            }
          >
            {isPending ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setConfirming(false)}>
            Voltar
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setConfirming(true)}>
          Cancelar pedido
        </Button>
      )}
    </section>
  );
}
