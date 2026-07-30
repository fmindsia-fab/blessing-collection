"use client";

import { useActionState } from "react";
import { updateStoreSettings, type StoreSettingsFormState } from "@/lib/store/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FONT_OPTIONS } from "@/lib/store/branding";
import type { FontFamily } from "@/types/database.types";

type StoreSettingsFormProps = {
  store: {
    id: string;
    whatsapp_number: string;
    instagram_url: string | null;
    description: string | null;
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    font_family: FontFamily;
  };
};

// input type="color" só aceita #rrggbb; valor inesperado do banco cairia em
// preto silenciosamente, então normalizamos antes de usar como defaultValue.
function colorOrDefault(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

const initialState: StoreSettingsFormState = {};

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateStoreSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsappNumber">WhatsApp (com DDI e DDD)</Label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          defaultValue={store.whatsapp_number}
          placeholder="5511999999999"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instagramUrl">Instagram (URL completa)</Label>
        <Input
          id="instagramUrl"
          name="instagramUrl"
          type="url"
          defaultValue={store.instagram_url ?? ""}
          placeholder="https://instagram.com/blessingcollection"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição da marca</Label>
        <Textarea id="description" name="description" defaultValue={store.description ?? ""} rows={4} />
      </div>

      <fieldset className="flex flex-col gap-4 border-t border-zinc-200 pt-4">
        <legend className="sr-only">Identidade visual</legend>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Identidade visual</span>
          <span className="text-xs text-zinc-500">Cores e fonte aplicadas ao catálogo público.</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="colorPrimary">Primária</Label>
            <Input
              id="colorPrimary"
              name="colorPrimary"
              type="color"
              defaultValue={colorOrDefault(store.color_primary, "#000000")}
              className="h-10 w-full p-1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="colorSecondary">Secundária</Label>
            <Input
              id="colorSecondary"
              name="colorSecondary"
              type="color"
              defaultValue={colorOrDefault(store.color_secondary, "#FFFFFF")}
              className="h-10 w-full p-1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="colorAccent">Destaque</Label>
            <Input
              id="colorAccent"
              name="colorAccent"
              type="color"
              defaultValue={colorOrDefault(store.color_accent, "#C9A227")}
              className="h-10 w-full p-1"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fontFamily">Fonte da marca</Label>
          <select
            id="fontFamily"
            name="fontFamily"
            defaultValue={store.font_family}
            className="h-10 rounded-md border border-zinc-300 bg-transparent px-3 text-sm"
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">Configurações salvas.</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
