import { getOwnerStore } from "@/lib/store/get-owner-store";
import { StoreSettingsForm } from "./store-settings-form";
import { StoreLogoForm } from "./store-logo-form";
import { PageHeading } from "@/components/admin/page-heading";
import { BrandFontUpload } from "./brand-font-upload";
import { ShareButton } from "@/components/shared/share-button";

export default async function AdminSettingsPage() {
  const store = await getOwnerStore();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <PageHeading
        kicker="Sua loja"
        title="Configurações"
        description="WhatsApp, redes sociais e identidade visual."
      />
      <StoreSettingsForm store={store} />

      <BrandFontUpload
        customFontName={store.custom_font_name}
        hasCustomFont={Boolean(store.custom_font_url)}
      />

      <StoreLogoForm logoUrl={store.logo_url} />

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Divulgar o catálogo</span>
          <span className="text-xs text-muted-foreground">
            Envie o link para clientes por WhatsApp, Instagram ou onde preferir.
          </span>
        </div>
        <ShareButton
          url={siteUrl}
          title={store.name}
          message={`Olha o catálogo da ${store.name}, que peças lindas!`}
          label="Compartilhar catálogo"
          className="w-fit"
        />
        <code className="w-fit border border-border bg-secondary/60 px-3 py-2 font-mono text-xs text-muted-foreground">
          {siteUrl || "Defina NEXT_PUBLIC_SITE_URL"}
        </code>
      </div>
    </div>
  );
}
