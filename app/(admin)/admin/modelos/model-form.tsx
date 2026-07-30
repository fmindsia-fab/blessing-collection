"use client";

import { useActionState } from "react";
import { createModel, type ModelFormState } from "@/lib/models/actions";
import { Button } from "@/components/ui/button";
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
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando..." : "Adicionar modelo"}
      </Button>
    </form>
  );
}
