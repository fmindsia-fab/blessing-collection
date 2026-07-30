import { vi } from "vitest";

/**
 * next/font/google só é executável sob o compilador do Next: fora dele, os
 * loaders não existem como funções. O mock é global porque `lib/store/fonts.ts`
 * é importado em cadeia por várias actions — sem isso, qualquer teste que
 * toque `lib/store/actions.ts` quebraria.
 *
 * Cada loader devolve a mesma forma que o real ({ variable }), com nome
 * distinto por fonte para que testes de fallback sejam significativos.
 */
const FONT_LOADERS = [
  "Playfair_Display",
  "Cormorant_Garamond",
  "Cormorant_Infant",
  "EB_Garamond",
  "Libre_Baskerville",
  "Lora",
  "Marcellus",
  "Prata",
  "Gilda_Display",
  "Italiana",
  "Montserrat",
  "Inter",
  "Raleway",
  "Jost",
  "Tenor_Sans",
  "Josefin_Sans",
  "Geist",
  "Geist_Mono",
];

vi.mock("next/font/google", () =>
  Object.fromEntries(
    FONT_LOADERS.map((name) => [name, () => ({ variable: `--font-${name.toLowerCase()}` })]),
  ),
);
