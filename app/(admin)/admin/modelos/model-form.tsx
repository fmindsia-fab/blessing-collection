"use client";

import { useActionState } from "react";
import { createModel, type ModelFormState } from "@/lib/models/actions";
import { FormFooter } from "@/components/admin/form-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ModelFormState = {};

export function ModelForm() {
  const [state, formAction, isPending] = useActionState(createModel, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Clutch, Tote, Transversal…" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" name="description" />
      </div>
      <FormFooter isPending={isPending} error={state.error} submitLabel="Adicionar modelo" />
    </form>
  );
}
