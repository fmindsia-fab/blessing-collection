import { SelectionProvider } from "@/lib/selection/selection-context";
import { SelectionFloatingButton } from "@/components/catalog/selection-floating-button";
import { SiteFooter } from "@/components/catalog/site-footer";
import { getActiveStore, isPlatformRequest } from "@/lib/store/get-active-store";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { isSafeBrandFontUrl } from "@/lib/store/branding";
import { hasStoreAccess } from "@/lib/billing/access";
import { CatalogUnavailable } from "@/components/catalog/catalog-unavailable";

// O tema de cores (buildStoreTheme) é aplicado no <body>, em app/layout.tsx —
// precisa estar lá, não aqui, porque --background só pinta o body se for
// definido no próprio body ou num ancestral dele (CSS custom properties
// herdam de pai para filho, nunca o contrário).
//
// No apex/www da plataforma não há loja nenhuma — app/(public)/page.tsx já
// decide renderizar a landing institucional em vez do catálogo; este layout
// só precisa não quebrar nesse caso (sem rodapé/seleção de loja nenhuma).
export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (await isPlatformRequest()) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  const store = await getActiveStore();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Trial expirado / assinatura vencida: catálogo fora do ar, mas a loja
  // segue resolvendo como tenant (o /admin do proprietário não é afetado).
  // Avaliado em tempo real a cada requisição, sem depender de cron.
  if (!(await hasStoreAccess(store.id))) {
    return <CatalogUnavailable storeName={store.name} />;
  }

  // Fonte própria enviada pela proprietária tem precedência sobre a curada —
  // desde que a URL seja comprovadamente do nosso bucket de fontes.
  const customFontUrl = isSafeBrandFontUrl(store.custom_font_url) ? store.custom_font_url : null;
  const fontVariable = customFontUrl ? "" : getBrandFontVariable(store.font_family);

  return (
    <SelectionProvider>
      {customFontUrl ? (
        <style
          // A URL vem do Storage e é validada no upload; o @font-face precisa
          // ser injetado em runtime porque next/font resolve em build.
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:'BrandCustom';src:url('${encodeURI(customFontUrl)}') format('woff2');font-display:swap;}`,
          }}
        />
      ) : null}

      <div
        className={`${fontVariable} flex flex-1 flex-col`}
        style={customFontUrl ? ({ "--font-brand": "'BrandCustom', Georgia, serif" } as React.CSSProperties) : undefined}
      >
        {children}
        <SiteFooter
          storeName={store.name}
          instagramUrl={store.instagram_url}
          whatsappNumber={store.whatsapp_number}
          siteUrl={siteUrl}
        />
      </div>
      <SelectionFloatingButton />
    </SelectionProvider>
  );
}
