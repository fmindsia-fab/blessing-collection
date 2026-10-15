import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getActiveStore, getSiteUrl, isPlatformRequest } from "@/lib/store/get-active-store";
import { buildStoreTheme } from "@/lib/store/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();

  return {
    // Por host: as URLs absolutas de OG/canonical seguem o domínio da loja.
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: "AteliFácil",
    description: "Catálogo digital de bolsas e acessórios artesanais.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // O tema precisa ir no <body>, não num <div> mais abaixo na árvore: CSS
  // custom properties só herdam de pai para filho, e o body pinta seu próprio
  // fundo com var(--background) resolvido no PRÓPRIO escopo (globals.css,
  // `body { @apply bg-background }`). Um filho reescrevendo --background não
  // repinta um ancestral que já resolveu a variável — por isso a cor de fundo
  // configurada em Configurações nunca aparecia, mesmo depois de salva.
  //
  // No apex/www da plataforma (ex. atelifacil.com.br) não existe "a loja
  // ativa" — é a área de marketing/cadastro do SaaS, sem marca de loja
  // nenhuma. buildStoreTheme({}) cai nos tokens padrão do globals.css.
  const isPlatform = await isPlatformRequest();
  const theme = isPlatform ? buildStoreTheme({}) : buildStoreTheme(await getActiveStore());

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={theme}>
        {children}
      </body>
    </html>
  );
}
