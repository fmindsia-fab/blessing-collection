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
    <form action={formAction} className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Logo da loja</span>
        <span className="text-xs text-zinc-500">JPEG, PNG ou WebP, até 2MB. SVG não é aceito.</span>
      </div>

      {logoUrl ? (
        <div className="relative h-20 w-40 overflow-hidden rounded-md bg-zinc-100">
          <Image src={logoUrl} alt="Logo atual da loja" fill className="object-contain" sizes="160px" />
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Nenhum logo enviado ainda.</p>
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
