import { SelectionProvider } from "@/lib/selection/selection-context";
import { SelectionFloatingButton } from "@/components/catalog/selection-floating-button";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { resolveBrandColors } from "@/lib/store/branding";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getActiveStore();
  const fontVariable = getBrandFontVariable(store.font_family);
  const palette = resolveBrandColors(store);

  // Cada cor da paleta vira --brand-1..5; as 3 primeiras mantêm o papel
  // semântico (primária, fundo, destaque) para uso direto no CSS.
  const paletteVars = Object.fromEntries(
    palette.map((color, index) => [`--brand-${index + 1}`, color]),
  );

  return (
    <SelectionProvider>
      <div
        className={`${fontVariable} flex flex-1 flex-col`}
        style={
          {
            ...paletteVars,
            "--brand-primary": palette[0],
            "--brand-secondary": palette[1] ?? palette[0],
            "--brand-accent": palette[2] ?? palette[0],
          } as React.CSSProperties
        }
      >
        {children}
      </div>
      <SelectionFloatingButton />
    </SelectionProvider>
  );
}
