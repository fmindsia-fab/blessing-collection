import {
  Playfair_Display,
  Cormorant_Garamond,
  EB_Garamond,
  Libre_Baskerville,
  Marcellus,
  Italiana,
  Prata,
  Gilda_Display,
  Cormorant_Infant,
  Montserrat,
  Inter,
  Raleway,
  Jost,
  Tenor_Sans,
  Josefin_Sans,
  Lora,
} from "next/font/google";

// next/font/google exige chamadas no escopo do módulo com todos os valores
// escritos como literais — nem uma constante compartilhada para `variable` é
// aceita, por isso "--font-brand" aparece repetido em cada chamada.
// A escolha é por lookup, nunca montada dinamicamente a partir do banco.
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-brand" });
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-brand",
});
const cormorantInfant = Cormorant_Infant({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-brand",
});
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--font-brand" });
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-brand",
});
const marcellus = Marcellus({ subsets: ["latin"], weight: ["400"], variable: "--font-brand" });
const italiana = Italiana({ subsets: ["latin"], weight: ["400"], variable: "--font-brand" });
const prata = Prata({ subsets: ["latin"], weight: ["400"], variable: "--font-brand" });
const gildaDisplay = Gilda_Display({ subsets: ["latin"], weight: ["400"], variable: "--font-brand" });
const lora = Lora({ subsets: ["latin"], variable: "--font-brand" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-brand" });
const inter = Inter({ subsets: ["latin"], variable: "--font-brand" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-brand" });
const jost = Jost({ subsets: ["latin"], variable: "--font-brand" });
const tenorSans = Tenor_Sans({ subsets: ["latin"], weight: ["400"], variable: "--font-brand" });
const josefinSans = Josefin_Sans({ subsets: ["latin"], variable: "--font-brand" });

// Metadados (label, grupo) vivem em font-catalog.ts, que é seguro no client.
const FONT_BY_VALUE: Record<string, { variable: string }> = {
  "playfair-display": playfairDisplay,
  "cormorant-garamond": cormorantGaramond,
  "cormorant-infant": cormorantInfant,
  "eb-garamond": ebGaramond,
  "libre-baskerville": libreBaskerville,
  lora,
  marcellus,
  prata,
  "gilda-display": gildaDisplay,
  italiana,
  montserrat,
  inter,
  raleway,
  jost,
  "tenor-sans": tenorSans,
  "josefin-sans": josefinSans,
};

// Fonte desconhecida (banco editado à mão, ou valor de uma versão anterior)
// cai no padrão em vez de quebrar a tipografia.
export function getBrandFontVariable(fontFamily: string): string {
  return (FONT_BY_VALUE[fontFamily] ?? playfairDisplay).variable;
}

export { DEFAULT_FONT, isCuratedFont, FONT_CATALOG, FONT_GROUP_LABEL } from "./font-catalog";
export type { FontGroup, FontMeta } from "./font-catalog";
