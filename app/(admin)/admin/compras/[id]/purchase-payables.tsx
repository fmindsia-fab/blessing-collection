"use client";

import { useActionState, useState } from "react";
import { createPurchasePayables, type FinanceFormState } from "@/lib/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFooter } from "@/components/admin/form-footer";
import { cn } from "@/lib/utils";

const initialState: FinanceFormState = {};

// Para compras que ficaram sem contas (feitas antes do financeiro ou esquecidas): lança como já
// paga ou em parcelas a pagar.
export function PurchasePayablesForm({ purchaseId, today }: { purchaseId: string; today: string }) {
  const [state, formAction, isPending] = useActionState(createPurchasePayables.bind(null, purchaseId), initialState);
  const [mode, setMode] = useState<"paid" | "later">("paid");
  const [installments, setInstallments] = useState("1");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Esta compra ainda não está em <strong>Contas a pagar</strong>. Lance como paga ou em parcelas para o dinheiro
        aparecer no fluxo de caixa.
      </p>
      <input type="hidden" name="paymentMode" value={mode} />
      <div role="group" aria-label="Como você pagou" className="flex flex-wrap gap-2">
        {[
          { value: "paid" as const, label: "Já paguei" },
          { value: "later" as const, label: "Vou pagar depois" },
        ].map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            aria-pressed={mode === option.value}
            onClick={() => setMode(option.value)}
            className={cn(mode === option.value && "border-[var(--gold)] bg-[var(--gold)] text-primary-foreground")}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {mode === "later" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pp-first-due">Vencimento da 1ª parcela</Label>
            <Input id="pp-first-due" name="firstDue" type="date" defaultValue={today} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pp-installments">Em quantas parcelas</Label>
            <Input
              id="pp-installments"
              name="installments"
              inputMode="numeric"
              value={installments}
              onChange={(event) => setInstallments(event.target.value.replace(/\D/g, "").slice(0, 2))}
              className="max-w-32"
            />
          </div>
        </div>
      ) : null}
      <FormFooter isPending={isPending} error={state.error} success={state.success} successMessage="Contas lançadas." submitLabel="Lançar em contas a pagar" />
    </form>
  );
}
