import { SelectionProvider } from "@/lib/selection/selection-context";
import { SelectionFloatingButton } from "@/components/catalog/selection-floating-button";
import { SiteFooter } from "@/components/catalog/site-footer";
import { getStoreBySlug } from "@/lib/store/get-store-by-slug";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { isSafeBrandFontUrl } from "@/lib/store/branding";
import { buildStoreTheme } from "@/lib/store/theme";

// Tema e fonte da loja resolvida pelo slug da URL — aplicados num wrapper com
// a classe .brand-scope (globals.css), não no <body> raiz: com múltiplas
// lojas simultâneas não existe mais uma identidade visual global única.
export default async function StoreLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}>) {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const theme = buildStoreTheme(store);

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
        className={`brand-scope ${fontVariable} flex flex-1 flex-col`}
        style={
          customFontUrl
            ? ({ ...theme, "--font-brand": "'BrandCustom', Georgia, serif" } as React.CSSProperties)
            : theme
        }
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
