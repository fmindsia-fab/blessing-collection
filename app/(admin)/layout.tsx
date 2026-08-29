import { getOwnerStore } from "@/lib/store/get-owner-store";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { buildStoreTheme } from "@/lib/store/theme";

// O painel usa a mesma fonte e a mesma paleta da marca: a proprietária vê o
// resultado das configurações também aqui, não só no catálogo público.
//
// O tema de cores (buildStoreTheme) é aplicado aqui, num wrapper com a classe
// .brand-scope (globals.css) que reaplica bg-background/text-foreground —
// o root layout (app/layout.tsx) ficou neutro porque não há mais uma única
// loja para pintar globalmente com múltiplas lojas ativas.
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getOwnerStore();
  const fontVariable = getBrandFontVariable(store.font_family);
  const theme = buildStoreTheme(store);

  return (
    <div className={`brand-scope ${fontVariable} flex flex-1 flex-col`} style={theme}>
      {children}
    </div>
  );
}
