"use client";

import { useActionState } from "react";
import { createPayable, type FinanceFormState } from "@/lib/finance/actions";
import { PAYABLE_CATEGORIES } from "@/lib/finance/calc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FormFooter } from "@/components/admin/form-footer";

const initialState: FinanceFormState = {};

export function PayableForm({ today }: { today: string }) {
  const [state, formAction, isPending] = useActionState(createPayable, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="description">O que é esta conta?</Label>
          <Input id="description" name="description" maxLength={120} required placeholder="Ex.: Caixas de embalagem" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Tipo</Label>
          <NativeSelect id="category" name="category" defaultValue="supplies">
            {PAYABLE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplier">Para quem vai pagar (opcional)</Label>
          <Input id="supplier" name="supplier" maxLength={80} placeholder="Ex.: Embalagens Bela" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input id="amount" name="amount" inputMode="decimal" required placeholder="0,00" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Vencimento</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={today} required />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm sm:col-span-2">
          <input type="checkbox" name="recurrence" value="monthly" className="mt-1 size-4 accent-[var(--gold)]" />
          <span>
            Repetir todo mês.{" "}
            <span className="text-muted-foreground">
              Quando você marcar esta conta como paga, a do mês seguinte aparece sozinha.
            </span>
          </span>
        </label>
      </section>

      <FormFooter sticky isPending={isPending} error={state.error} submitLabel="Salvar conta" pendingLabel="Salvando..." />
    </form>
  );
}
