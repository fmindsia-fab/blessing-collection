"use client";

import { useState, useTransition } from "react";
import { cancelOrder, updateOrderStatus, type OrderStatusResult } from "@/lib/orders/actions";
import { Button } from "@/components/ui/button";
import { StockNotice } from "@/components/admin/stock-notice";

// Cancelar NÃO apaga: o pedido muda para "Cancelado", sai das listas de trabalho
// e das contas do painel, e o histórico fica guardado. Por isso há também como
// reabrir (volta como orçamento). A confirmação em dois cliques evita o toque
// por engano, já que o cancelamento tira o pedido da fila de produção.
//
// Se o pedido já descontou materiais do estoque, a confirmação pergunta se eles voltam: só a
// artesã sabe se a peça chegou a ser feita. Reabrir não devolve nada (os materiais já saíram).
export function CancelOrderButton({
  orderId,
  cancelled,
  stockConsumed,
}: {
  orderId: string;
  cancelled: boolean;
  /** O pedido já descontou materiais do estoque (entrou em produção). */
  stockConsumed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<OrderStatusResult | null>(null);

  function run(action: () => Promise<OrderStatusResult>) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      setNotice(result);
      if (!result.error) setConfirming(false);
    });
  }

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
          onClick={() => run(() => updateOrderStatus(orderId, "quote"))}
        >
          {isPending ? "Reabrindo..." : "Reabrir como orçamento"}
        </Button>
        <StockNotice result={notice} onDismiss={() => setNotice(null)} />
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
        <div className="flex flex-col gap-3">
          {stockConsumed ? (
            <p className="text-sm font-medium">
              Este pedido já descontou materiais do estoque. Se a peça ainda não foi feita, devolva os materiais; se
              já foram usados, mantenha descontado.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {stockConsumed ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => run(() => cancelOrder(orderId, true))}
                >
                  {isPending ? "Cancelando..." : "Cancelar e devolver ao estoque"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => run(() => cancelOrder(orderId, false))}
                >
                  Cancelar e manter descontado
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => run(() => cancelOrder(orderId))}
              >
                {isPending ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setConfirming(false)}>
              Voltar
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setConfirming(true)}>
          Cancelar pedido
        </Button>
      )}
      <StockNotice result={notice} onDismiss={() => setNotice(null)} />
    </section>
  );
}
