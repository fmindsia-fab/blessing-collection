import { SelectionProvider } from "@/lib/selection/selection-context";
import { SelectionFloatingButton } from "@/components/catalog/selection-floating-button";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { isValidHexColor } from "@/lib/store/branding";

// Cor gravada fora do formato hex (banco editado à mão) cai no padrão em vez
// de injetar um valor arbitrário no style.
function safeColor(value: string, fallback: string) {
  return isValidHexColor(value) ? value : fallback;
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getActiveStore();
  const fontVariable = getBrandFontVariable(store.font_family);

  return (
    <SelectionProvider>
      <div
        className={`${fontVariable} flex flex-1 flex-col font-[family-name:var(--font-brand)]`}
        style={
          {
            "--brand-primary": safeColor(store.color_primary, "#000000"),
            "--brand-secondary": safeColor(store.color_secondary, "#FFFFFF"),
            "--brand-accent": safeColor(store.color_accent, "#C9A227"),
          } as React.CSSProperties
        }
      >
        {children}
      </div>
      <SelectionFloatingButton />
    </SelectionProvider>
  );
}
