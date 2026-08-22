import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getActiveStore } from "@/lib/store/get-active-store";
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

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: "Blessing Collection",
  description: "Catálogo digital de bolsas e acessórios artesanais.",
};

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
  const store = await getActiveStore();
  const theme = buildStoreTheme(store);

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
