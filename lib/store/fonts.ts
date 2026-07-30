import { Playfair_Display, Cormorant_Garamond, Lora, Montserrat, Inter } from "next/font/google";
import type { FontFamily } from "@/types/database.types";

// next/font/google exige chamadas no escopo do módulo com literais estáticos —
// por isso as 5 são declaradas aqui e escolhidas por lookup, não montadas
// dinamicamente a partir do valor do banco.
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-brand" });
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-brand",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-brand" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-brand" });
const inter = Inter({ subsets: ["latin"], variable: "--font-brand" });

const FONT_BY_FAMILY: Record<FontFamily, { variable: string }> = {
  "playfair-display": playfairDisplay,
  "cormorant-garamond": cormorantGaramond,
  lora,
  montserrat,
  inter,
};

// Fonte desconhecida (banco alterado à mão) cai no padrão em vez de quebrar.
export function getBrandFontVariable(fontFamily: string): string {
  return (FONT_BY_FAMILY[fontFamily as FontFamily] ?? playfairDisplay).variable;
}
