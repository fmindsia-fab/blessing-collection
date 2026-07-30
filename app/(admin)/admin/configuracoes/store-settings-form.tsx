"use client";

import { useActionState } from "react";
import { updateStoreSettings, type StoreSettingsFormState } from "@/lib/store/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveBrandColors } from "@/lib/store/branding";
import { BrandPaletteField } from "./brand-palette-field";
import { BrandFontField } from "./brand-font-field";
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
    brand_colors?: string[] | null;
    font_family: FontFamily;
    custom_font_url?: string | null;
    custom_font_name?: string | null;
  };
};

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

      <fieldset className="flex flex-col gap-6 border-t border-border pt-6">
        <legend className="sr-only">Identidade visual</legend>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Identidade visual</span>
          <span className="text-xs text-muted-foreground">Cores e fonte aplicadas ao catálogo público.</span>
        </div>

        <BrandPaletteField initialColors={resolveBrandColors(store)} />

        <BrandFontField
          fontFamily={store.font_family}
          customFontName={store.custom_font_name ?? null}
          hasCustomFont={Boolean(store.custom_font_url)}
        />
      </fieldset>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">Configurações salvas.</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
