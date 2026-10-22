"use client";

import { useActionState, useTransition } from "react";
import {
  createPaymentMethod,
  togglePaymentMethod,
  updatePaymentMethodFee,
  type PricingFormState,
} from "@/lib/pricing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/admin/status-pill";
import type { ArchivableStatus } from "@/types/database.types";

type Method = {
  id: string;
  label: string;
  fee_percent: number;
  installments: number;
  status: ArchivableStatus;
};

const initialState: PricingFormState = {};

export function PaymentMethods({ methods }: { methods: Method[] }) {
  const [state, formAction, isPending] = useActionState(createPaymentMethod, initialState);
  const [isSaving, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        As taxas variam por maquininha e por negociação — preencha com as que você realmente paga.
        Elas entram no cálculo do preço para que a margem não seja corroída.
      </p>

      <div className="flex flex-col gap-2">
        {methods.map((method) => {
          const isArchived = method.status === "archived";

          return (
            <div
              key={method.id}
              className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-[var(--gold)]/40 ${isArchived ? "opacity-70" : ""}`}
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{method.label}</span>
                <span className="text-xs text-muted-foreground">
                  {method.installments > 1 ? `${method.installments} parcelas` : "à vista"}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {isArchived ? <StatusPill tone="muted">Oculta</StatusPill> : null}

                <div className="flex items-center gap-1.5">
                  {/* Salva ao sair do campo: evita um botão por linha. */}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    defaultValue={method.fee_percent || ""}
                    placeholder="0"
                    aria-label={`Taxa de ${method.label} em porcentagem`}
                    onBlur={(e) => {
                      const value = Number(e.target.value) || 0;
                      if (value === method.fee_percent) return;
                      startTransition(() => updatePaymentMethodFee(method.id, value));
                    }}
                    className="w-20 text-right tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => startTransition(() => togglePaymentMethod(method.id, method.status))}
                >
                  {isArchived ? "Usar" : "Ocultar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-label">Nova forma</Label>
          <Input id="pm-label" name="label" required maxLength={40} placeholder="Crédito 4x" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-fee">Taxa (%)</Label>
          <Input
            id="pm-fee"
            name="feePercent"
            type="number"
            step="0.01"
            min="0"
            max="99.99"
            className="w-24"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-installments">Parcelas</Label>
          <Input
            id="pm-installments"
            name="installments"
            type="number"
            min="1"
            max="12"
            defaultValue="1"
            className="w-24"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending} className="self-end">
          {isPending ? "Salvando..." : "Adicionar"}
        </Button>

        {state.error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive sm:col-span-4">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
