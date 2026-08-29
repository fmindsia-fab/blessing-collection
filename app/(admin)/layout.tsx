import { getOwnerStore } from "@/lib/store/get-owner-store";
import { getBrandFontVariable } from "@/lib/store/fonts";

// O painel usa a mesma fonte e a mesma paleta da marca: a proprietária vê o
// resultado das configurações também aqui, não só no catálogo público.
//
// O tema de cores em si (buildStoreTheme) é aplicado no <body>, em
// app/layout.tsx — precisa estar lá, não aqui, porque --background só pinta o
// body se for definido no próprio body ou num ancestral dele (CSS custom
// properties herdam de pai para filho, nunca o contrário).
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getOwnerStore();
  const fontVariable = getBrandFontVariable(store.font_family);

  return <div className={`${fontVariable} flex flex-1 flex-col`}>{children}</div>;
}
