"use client";

import { useActionState } from "react";
import { requestPasswordReset, type PasswordResetRequestState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_STATE: PasswordResetRequestState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, INITIAL_STATE);

  if (state.success) {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-4 text-sm">
        <strong className="font-semibold">Verifique seu e-mail</strong>
        <p className="text-muted-foreground">
          Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Ele vale por
          tempo limitado. Confira também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
