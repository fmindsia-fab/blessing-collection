"use client";

import { useActionState } from "react";
import { updateCustomer, type CustomerFormState } from "@/lib/customers/actions";
import type { CustomerRow } from "@/lib/customers/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CustomerFormState = {};

export function CustomerForm({ customer }: { customer: CustomerRow }) {
  const [state, formAction, isPending] = useActionState(updateCustomer.bind(null, customer.id), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required maxLength={120} defaultValue={customer.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" maxLength={30} defaultValue={customer.phone ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={customer.notes ?? ""} />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">Salvo.</p> : null}

      <Button type="submit" variant="outline" disabled={isPending} className="w-fit">
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
