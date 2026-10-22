"use client";

import Image from "next/image";
import { useActionState } from "react";
import { uploadStoreLogo, type StoreSettingsFormState } from "@/lib/store/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: StoreSettingsFormState = {};

export function StoreLogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(uploadStoreLogo, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tracking-tight">Logo da loja</span>
        <span className="text-sm text-muted-foreground">JPEG, PNG ou WebP, até 2MB. SVG não é aceito.</span>
      </div>

      {logoUrl ? (
        <div className="relative h-20 w-40 overflow-hidden rounded-xl bg-secondary">
          <Image src={logoUrl} alt="Logo atual da loja" fill className="object-contain" sizes="160px" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum logo enviado ainda.</p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logo">Enviar novo logo</Label>
        <Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" required />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">Logo atualizado.</p> : null}

      <Button type="submit" variant="outline" disabled={isPending} className="w-fit">
        {isPending ? "Enviando..." : "Enviar logo"}
      </Button>
    </form>
  );
}
