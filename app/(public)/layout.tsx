import { SelectionProvider } from "@/lib/selection/selection-context";
import { SelectionFloatingButton } from "@/components/catalog/selection-floating-button";
import { SiteFooter } from "@/components/catalog/site-footer";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { isSafeBrandFontUrl, resolveBrandColors } from "@/lib/store/branding";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getActiveStore();
  const palette = resolveBrandColors(store);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Fonte própria enviada pela proprietária tem precedência sobre a curada —
  // desde que a URL seja comprovadamente do nosso bucket de fontes.
  const customFontUrl = isSafeBrandFontUrl(store.custom_font_url) ? store.custom_font_url : null;
  const fontVariable = customFontUrl ? "" : getBrandFontVariable(store.font_family);

  // Cada cor da paleta vira --brand-1..5; as 3 primeiras mantêm o papel
  // semântico (primária, fundo, destaque) para uso direto no CSS.
  const paletteVars = Object.fromEntries(
    palette.map((color, index) => [`--brand-${index + 1}`, color]),
  );

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
        style={
          {
            ...paletteVars,
            "--brand-primary": palette[0],
            "--brand-secondary": palette[1] ?? palette[0],
            "--brand-accent": palette[2] ?? palette[0],
            ...(customFontUrl ? { "--font-brand": "'BrandCustom', Georgia, serif" } : {}),
          } as React.CSSProperties
        }
      >
        {children}
        <SiteFooter
          storeName={store.name}
          instagramUrl={store.instagram_url}
          siteUrl={siteUrl}
        />
      </div>
      <SelectionFloatingButton />
    </SelectionProvider>
  );
}
