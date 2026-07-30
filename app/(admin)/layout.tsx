import { getActiveStore } from "@/lib/store/get-active-store";
import { getBrandFontVariable } from "@/lib/store/fonts";
import { buildStoreTheme } from "@/lib/store/theme";

// O painel usa a mesma fonte e a mesma paleta da marca: a proprietária vê o
// resultado das configurações também aqui, não só no catálogo público.
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getActiveStore();
  const fontVariable = getBrandFontVariable(store.font_family);
  const theme = buildStoreTheme(store);

  return (
    <div className={`${fontVariable} flex flex-1 flex-col`} style={theme}>
      {children}
    </div>
  );
}
