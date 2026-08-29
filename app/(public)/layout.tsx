// Wrapper neutro para as rotas públicas fora de uma loja (landing da
// plataforma em "/", cadastro em "/cadastro"). O tema de marca só existe
// dentro de uma loja resolvida por slug — ver app/(public)/loja/[storeSlug]/layout.tsx.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="brand-scope flex flex-1 flex-col">{children}</div>;
}
