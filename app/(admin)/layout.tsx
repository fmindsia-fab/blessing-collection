import { getActiveStore } from "@/lib/store/get-active-store";
import { getBrandFontVariable } from "@/lib/store/fonts";

// O painel usa a mesma fonte da marca nos títulos; sem esta variável o
// `font-[family-name:var(--font-brand)]` das telas admin cairia no fallback.
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getActiveStore();
  const fontVariable = getBrandFontVariable(store.font_family);

  return <div className={`${fontVariable} flex flex-1 flex-col`}>{children}</div>;
}
