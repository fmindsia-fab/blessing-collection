"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon } from "lucide-react";
import { cancelPayable, markPayablePaid, unmarkPayablePaid } from "@/lib/finance/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

// Botões de uma conta: marcar como paga (hoje), desfazer o pagamento e remover. Remover não apaga:
// a conta sai das listas e do fluxo de caixa, mas continua guardada.
export function PayableActions({
  payableId,
  isPaid,
  description,
}: {
  payableId: string;
  isPaid: boolean;
  description: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap gap-2">
        {isPaid ? (
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => run(() => unmarkPayablePaid(payableId))}>
            Desfazer pagamento
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={isPending} onClick={() => run(() => markPayablePaid(payableId))}>
            {isPending ? "Salvando..." : "Marcar como paga"}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setConfirming(true)}>
          Remover
        </Button>
      </div>
      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Remover esta conta?"
        description={`"${description}" sai da lista e do fluxo de caixa. Use isto para uma conta lançada por engano.`}
        confirmLabel="Remover conta"
        onConfirm={() => run(() => cancelPayable(payableId))}
      />
    </div>
  );
}
