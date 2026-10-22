"use client";

import { useActionState, useState } from "react";
import { formatWhatsappBR } from "@/lib/customers/phone-mask";
import { updateStoreSettings, type StoreSettingsFormState } from "@/lib/store/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveBrandColors } from "@/lib/store/branding";
import { BrandPaletteField } from "./brand-palette-field";
import { CraftProfileFields } from "@/components/shared/craft-profile-fields";
import { MarketplaceProfileFields } from "@/components/shared/marketplace-profile-fields";
import { BrandFontField } from "./brand-font-field";
import type { FontFamily } from "@/types/database.types";
import { FormFooter } from "@/components/admin/form-footer";

type StoreSettingsFormProps = {
  store: {
    id: string;
    name: string;
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
    pix_key?: string | null;
    city?: string | null;
    state?: string | null;
    craft_types?: string[] | null;
    craft_other?: string | null;
    accepts_custom_orders?: boolean | null;
    ships_nationwide?: boolean | null;
    years_active?: string | null;
    marketplace_opt_in?: boolean;
  };
};

const initialState: StoreSettingsFormState = {};

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateStoreSettings, initialState);
  const [whatsapp, setWhatsapp] = useState(() => formatWhatsappBR(store.whatsapp_number));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome da loja</Label>
        <Input id="name" name="name" defaultValue={store.name} maxLength={80} required />
        <span className="text-xs text-muted-foreground">
          O endereço do catálogo continua o mesmo ao trocar o nome.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsappNumber">WhatsApp</Label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={whatsapp}
          onChange={(e) => setWhatsapp(formatWhatsappBR(e.target.value))}
          placeholder="(11) 99999-9999"
          required
        />
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">Sobre o ateliê</legend>
        <CraftProfileFields
          defaultCity={store.city ?? ""}
          defaultState={store.state ?? ""}
          defaultCraftTypes={store.craft_types ?? []}
          defaultCraftOther={store.craft_other ?? ""}
        />
      </fieldset>

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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pixKey">Chave PIX</Label>
        <Input
          id="pixKey"
          name="pixKey"
          defaultValue={store.pix_key ?? ""}
          placeholder="CPF, e-mail, telefone ou chave aleatória"
          maxLength={140}
        />
        <span className="text-xs text-muted-foreground">
          Usada ao montar a cobrança de um pedido para enviar à cliente.
        </span>
      </div>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-6">
        <legend className="sr-only">Divulgação</legend>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Divulgação no marketplace</span>
          <span className="text-xs text-muted-foreground">
            Ajuda clientes a encontrarem o seu ateliê quando o marketplace for lançado.
          </span>
        </div>
        <MarketplaceProfileFields
          acceptsCustomOrders={store.accepts_custom_orders ?? null}
          shipsNationwide={store.ships_nationwide ?? null}
          yearsActive={store.years_active ?? ""}
          marketplaceOptIn={store.marketplace_opt_in ?? false}
        />
      </fieldset>

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

      <FormFooter
        sticky
        isPending={isPending}
        error={state.error}
        success={state.success}
        successMessage="Configurações salvas."
      />
    </form>
  );
}
