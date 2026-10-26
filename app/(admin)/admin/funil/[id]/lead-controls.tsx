"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon } from "lucide-react";
import { archiveLead, setLeadStage, startOrderFromLead } from "@/lib/leads/actions";
import { LEAD_STAGES, LOST_REASON_SUGGESTIONS } from "@/lib/leads/calc";
import type { LeadStage } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

// Escolher a etapa: "Perdido" pede o motivo antes de confirmar, para o resumo mostrar por que não fechou.
export function StageControl({ leadId, stage, lostReason }: { leadId: string; stage: LeadStage; lostReason: string | null }) {
  const [choosingLost, setChoosingLost] = useState(false);
  const [reason, setReason] = useState(lostReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function change(next: LeadStage, why?: string) {
    setError(null);
    startTransition(async () => {
      const result = await setLeadStage(leadId, next, why);
      if (result.error) setError(result.error);
      else setChoosingLost(false);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Etapa do contato" className="flex flex-wrap gap-2">
        {LEAD_STAGES.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={stage === item.value}
            disabled={isPending}
            onClick={() => (item.value === "lost" ? setChoosingLost(true) : change(item.value))}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:opacity-60",
              stage === item.value
                ? "border-[var(--gold)] bg-[var(--gold)] text-primary-foreground"
                : "border-border text-muted-foreground hover:border-[var(--gold)] hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {choosingLost ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-secondary/50 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lost-reason">Por que não fechou? (opcional)</Label>
            <Input id="lost-reason" list="lost-reasons" value={reason} maxLength={200} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: Preço" />
            <datalist id="lost-reasons">
              {LOST_REASON_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isPending} onClick={() => change("lost", reason)}>
              {isPending ? "Salvando..." : "Marcar como perdido"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setChoosingLost(false)}>
              Voltar
            </Button>
          </div>
        </div>
      ) : null}

      <ErrorLine message={error} />
    </div>
  );
}

export function LeadActions({ leadId, hasOrder }: { leadId: string; hasOrder: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={isPending} onClick={() => run(() => startOrderFromLead(leadId))}>
          {hasOrder ? "Abrir o pedido" : isPending ? "Abrindo..." : "Virar pedido"}
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={() => setConfirming(true)}>
          Remover do funil
        </Button>
      </div>
      {!hasOrder ? (
        <p className="text-sm text-muted-foreground">
          Cadastra a cliente (se ainda não existir) e abre um novo pedido. Ao salvar o pedido, o contato vira &quot;Fechado&quot;.
        </p>
      ) : null}
      <ErrorLine message={error} />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Remover este contato do funil?"
        description="Ele sai do quadro e das contas do resumo. Se tiver pedido, o pedido continua como está."
        confirmLabel="Remover contato"
        onConfirm={() => run(() => archiveLead(leadId))}
      />
    </div>
  );
}
