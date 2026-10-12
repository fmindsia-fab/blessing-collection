import { getActiveStore, isPlatformRequest } from "@/lib/store/get-active-store";
import { getBrandFontVariable } from "@/lib/store/fonts";

// O painel usa a mesma fonte e a mesma paleta da marca: a proprietária vê o
// resultado das configurações também aqui, não só no catálogo público.
//
// O tema de cores em si (buildStoreTheme) é aplicado no <body>, em
// app/layout.tsx — precisa estar lá, não aqui, porque --background só pinta o
// body se for definido no próprio body ou num ancestral dele (CSS custom
// properties herdam de pai para filho, nunca o contrário).
//
// /login também está neste route group e precisa funcionar sem loja ativa
// nenhuma (ex. platform admin acessando pelo apex antes de /admin-plataforma
// redirecionar) — isPlatformRequest() evita chamar getActiveStore() nesse caso.
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isPlatform = await isPlatformRequest();
  const fontVariable = isPlatform ? "" : getBrandFontVariable((await getActiveStore()).font_family);

  return <div className={`${fontVariable} flex flex-1 flex-col`}>{children}</div>;
}
