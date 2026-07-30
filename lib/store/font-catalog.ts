/**
 * Metadados das fontes curadas — sem importar next/font/google, que só pode
 * ser chamado em Server Components. Este módulo é seguro no client (usado
 * pelo seletor de fontes do painel); as instâncias ficam em `fonts.ts`.
 */

export type FontGroup = "serif" | "sans";

export type FontMeta = {
  value: string;
  label: string;
  group: FontGroup;
};

// Curadoria alinhada à direção visual do catálogo (PRD seção 8): elegante,
// feminina, editorial. Sem fontes de aparência tecnológica ou genérica.
export const FONT_CATALOG: FontMeta[] = [
  { value: "playfair-display", label: "Playfair Display", group: "serif" },
  { value: "cormorant-garamond", label: "Cormorant Garamond", group: "serif" },
  { value: "cormorant-infant", label: "Cormorant Infant", group: "serif" },
  { value: "eb-garamond", label: "EB Garamond", group: "serif" },
  { value: "libre-baskerville", label: "Libre Baskerville", group: "serif" },
  { value: "lora", label: "Lora", group: "serif" },
  { value: "marcellus", label: "Marcellus", group: "serif" },
  { value: "prata", label: "Prata", group: "serif" },
  { value: "gilda-display", label: "Gilda Display", group: "serif" },
  { value: "italiana", label: "Italiana", group: "serif" },
  { value: "montserrat", label: "Montserrat", group: "sans" },
  { value: "inter", label: "Inter", group: "sans" },
  { value: "raleway", label: "Raleway", group: "sans" },
  { value: "jost", label: "Jost", group: "sans" },
  { value: "tenor-sans", label: "Tenor Sans", group: "sans" },
  { value: "josefin-sans", label: "Josefin Sans", group: "sans" },
];

export const FONT_GROUP_LABEL: Record<FontGroup, string> = {
  serif: "Serifadas (clássicas, editoriais)",
  sans: "Sem serifa (modernas, limpas)",
};

export const DEFAULT_FONT = "playfair-display";

const VALUES = new Set(FONT_CATALOG.map((option) => option.value));

export function isCuratedFont(value: string): boolean {
  return VALUES.has(value);
}

// Nome real da família, para a prévia no painel via CSS puro (sem carregar a
// fonte pelo next/font, que é server-only).
export function fontFamilyPreview(label: string): string {
  return `'${label}', Georgia, serif`;
}
