import { fraunces, inter } from "./landing-fonts";

// Wrapper das rotas públicas fora de uma loja (landing da plataforma em "/",
// cadastro em "/cadastro"). O tema de marca por loja só existe dentro de uma
// loja resolvida por slug — ver app/(public)/loja/[storeSlug]/layout.tsx.
// A tipografia aqui (Fraunces + Inter) é da plataforma em si, deliberadamente
// distinta de qualquer --font-brand escolhida por uma loja individual.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`brand-scope ${fraunces.variable} ${inter.variable} flex flex-1 flex-col`}>
      {children}
    </div>
  );
}
