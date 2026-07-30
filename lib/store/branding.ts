import type { FontFamily } from "@/types/database.types";

// As 5 fontes são fixas e carregadas via next/font/google no layout público.
// Nunca aceitar fonte arbitrária vinda do banco: evita fonte não licenciada
// ou erro de digitação derrubando a tipografia do catálogo (PLAN.md seção 2).
export const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "playfair-display", label: "Playfair Display (serifada clássica)" },
  { value: "cormorant-garamond", label: "Cormorant Garamond (serifada delicada)" },
  { value: "lora", label: "Lora (serifada legível)" },
  { value: "montserrat", label: "Montserrat (sem serifa moderna)" },
  { value: "inter", label: "Inter (sem serifa neutra)" },
];

export const FONT_VALUES = FONT_OPTIONS.map((option) => option.value) as [FontFamily, ...FontFamily[]];

// Cor hex de 6 dígitos, com #. O mesmo formato aceito pelo input type="color".
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}
