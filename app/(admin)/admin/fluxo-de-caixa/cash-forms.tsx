"use client";

import { useActionState, useState, useTransition } from "react";
import { addCashIncome, cancelCashIncome, saveCashOpening, type FinanceFormState } from "@/lib/finance/actions";
import { formatDateBR, formatMoney } from "@/lib/stock/format";
import type { CashIncomeRow } from "@/lib/finance/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFooter } from "@/components/admin/form-footer";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const initialState: FinanceFormState = {};

export function OpeningBalanceForm({ amount, date, today }: { amount: number; date: string | null; today: string }) {
  const [state, formAction, isPending] = useActionState(saveCashOpening, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opening-amount">Quanto você tem no caixa (R$)</Label>
          <Input id="opening-amount" name="amount" inputMode="decimal" defaultValue={amount ? String(amount).replace(".", ",") : ""} placeholder="0,00" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opening-date">Nesta data</Label>
          <Input id="opening-date" name="date" type="date" defaultValue={date ?? today} max={today} required />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        O saldo conta a partir desta data: o que você recebeu ou pagou antes dela já está dentro desse valor.
      </p>
      <FormFooter isPending={isPending} error={state.error} success={state.success} successMessage="Saldo salvo." submitLabel="Salvar saldo" />
    </form>
  );
}

export function CashIncomeForm({ today }: { today: string }) {
  const [state, formAction, isPending] = useActionState(addCashIncome, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <Label htmlFor="income-description">De onde veio o dinheiro?</Label>
          <Input id="income-description" name="description" maxLength={120} required placeholder="Ex.: Venda na feira" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="income-amount">Valor (R$)</Label>
          <Input id="income-amount" name="amount" inputMode="decimal" required placeholder="0,00" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="income-date">Quando recebeu</Label>
          <Input id="income-date" name="receivedAt" type="date" defaultValue={today} max={today} required />
        </div>
      </div>
      <FormFooter isPending={isPending} error={state.error} success={state.success} successMessage="Entrada anotada." submitLabel="Anotar entrada" />
    </form>
  );
}

export function CashIncomeList({ incomes }: { incomes: CashIncomeRow[] }) {
  const [removing, setRemoving] = useState<CashIncomeRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(income: CashIncomeRow) {
    setError(null);
    startTransition(async () => {
      const result = await cancelCashIncome(income.id);
      if (result.error) setError(result.error);
    });
  }

  if (incomes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold">Entradas anotadas</h3>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border/70">
        {incomes.map((income) => (
          <li key={income.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="break-words text-base font-medium">{income.description}</span>
              <span className="text-sm text-muted-foreground">{formatDateBR(income.receivedAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold tabular-nums">{formatMoney(income.amount)}</span>
              <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setRemoving(income)}>
                Remover
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Remover esta entrada?"
        description={removing ? `"${removing.description}" (${formatMoney(removing.amount)}) sai do fluxo de caixa.` : ""}
        confirmLabel="Remover entrada"
        onConfirm={() => {
          if (removing) remove(removing);
        }}
      />
    </div>
  );
}
