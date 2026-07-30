"use client";

import { useActionState, useTransition } from "react";
import { uploadBrandFont, removeBrandFont, type StoreSettingsFormState } from "@/lib/store/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: StoreSettingsFormState = {};

export function BrandFontUpload({
  customFontName,
  hasCustomFont,
}: {
  customFontName: string | null;
  hasCustomFont: boolean;
}) {
  const [state, formAction, isPending] = useActionState(uploadBrandFont, initialState);
  const [isRemoving, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Enviar fonte própria</span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          Arquivo <code className="font-mono">.woff2</code>, até 2MB. Use apenas fontes que você tem
          licença para usar na web. Enquanto houver uma fonte enviada, ela substitui a lista curada.
        </span>
      </div>

      {hasCustomFont ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-secondary/60 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm">{customFontName}</span>
            <span className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">
              Em uso no catálogo
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRemoving}
            onClick={() => startTransition(() => void removeBrandFont())}
          >
            {isRemoving ? "Removendo..." : "Voltar à lista curada"}
          </Button>
        </div>
      ) : null}

      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fontName">Nome da fonte</Label>
          <Input id="fontName" name="fontName" placeholder="Ex: Canela Deck" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="font">Arquivo .woff2</Label>
          <Input id="font" name="font" type="file" accept=".woff2,font/woff2" required />
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">Fonte aplicada ao catálogo.</p> : null}

        <Button type="submit" variant="outline" disabled={isPending} className="w-fit">
          {isPending ? "Enviando..." : "Enviar fonte"}
        </Button>
      </form>
    </div>
  );
}
