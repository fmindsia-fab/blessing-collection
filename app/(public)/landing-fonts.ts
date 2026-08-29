import { Fraunces, Inter } from "next/font/google";

// Fonte própria da landing da plataforma — deliberadamente distinta da
// tipografia de qualquer loja individual (--font-brand, escolhida por cada
// proprietária em lib/store/fonts.ts). A landing representa a Blessing
// Collection como plataforma, não uma loja específica.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-landing-display",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-landing-body",
});
