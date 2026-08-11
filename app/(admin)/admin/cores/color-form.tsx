"use client";

import { useActionState, useState } from "react";
import { createColor, type ColorFormState } from "@/lib/colors/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorSwatchInput } from "./color-swatch-input";

const initialState: ColorFormState = {};

export function ColorForm() {
  const [state, formAction, isPending] = useActionState(createColor, initialState);
  const [hasSecondary, setHasSecondary] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome da cor</Label>
        <Input id="name" name="name" required maxLength={60} placeholder="Marsala" />
      </div>

      <ColorSwatchInput id="hex" name="hex" label="Cor" defaultValue="#B8A99A" />

      {hasSecondary ? (
        <ColorSwatchInput
          id="hexSecondary"
          name="hexSecondary"
          label="Segunda cor"
          defaultValue="#F0EAE0"
          onRemove={() => setHasSecondary(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setHasSecondary(true)}
          className="self-start text-xs text-muted-foreground underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          + Segunda cor (peças bicolores)
        </button>
      )}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando..." : "Adicionar cor"}
      </Button>
    </form>
  );
}
