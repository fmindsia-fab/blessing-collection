"use client";

import { useState, useTransition } from "react";
import { setLeadStage } from "@/lib/leads/actions";
import { Button } from "@/components/ui/button";

// Atalho do cartão: passa o contato para a próxima etapa sem abrir a tela dele.
export function AdvanceButton({ leadId, nextStage, label }: { leadId: string; nextStage: string; label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setLeadStage(leadId, nextStage);
            if (result.error) setError(result.error);
          });
        }}
      >
        {isPending ? "Movendo..." : `Mover para ${label}`}
      </Button>
      {error ? (
        <span role="alert" className="text-xs font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
