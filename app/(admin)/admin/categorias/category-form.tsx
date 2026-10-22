"use client";

import { useActionState } from "react";
import { createCategory, type CategoryFormState } from "@/lib/categories/actions";
import { FormFooter } from "@/components/admin/form-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CategoryFormState = {};

export function CategoryForm() {
  const [state, formAction, isPending] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" name="description" />
      </div>
      <FormFooter isPending={isPending} error={state.error} submitLabel="Adicionar categoria" />
    </form>
  );
}
