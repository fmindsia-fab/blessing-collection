"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon } from "lucide-react";
import { cancelPurchase } from "@/lib/stock/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

// Cancelar NÃO apaga: a compra fica no histórico como "Cancelada" e os itens saem do estoque por
// um lançamento de ajuste. Serve para uma compra lançada por engano.
export function CancelPurchaseButton({ purchaseId }: { purchaseId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelPurchase(purchaseId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Lançou esta compra por engano? Ao cancelar, os itens saem do estoque e a compra continua no histórico como
        &quot;Cancelada&quot;. O custo cadastrado dos materiais não volta ao valor anterior.
      </p>
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
      <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(true)} className="w-full sm:w-fit">
        {isPending ? "Cancelando..." : "Cancelar esta compra"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancelar esta compra?"
        description="Os itens saem do estoque e a compra fica marcada como cancelada no histórico."
        confirmLabel="Cancelar compra"
        cancelLabel="Voltar"
        onConfirm={cancel}
      />
    </section>
  );
}
