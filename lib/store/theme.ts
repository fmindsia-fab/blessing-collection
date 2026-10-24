import { resolveBrandColors } from "./branding";
import { ensureLightEnough, hexToHsl, hslToHex } from "./color-harmony";

/**
 * Converte a paleta da loja em variáveis CSS do tema.
 *
 * Antes as cores só viravam --brand-1..5, que quase nada consumia — configurar
 * a paleta não mudava a aparência do catálogo. Agora elas alimentam os tokens
 * que todo componente já usa (--accent, --secondary, --gold…), então a escolha
 * da proprietária se propaga por todas as páginas.
 *
 * Papéis: [1] primária (títulos e CTAs), [2] fundo, [3] destaque (acento),
 * [4] e [5] apoio opcional.
 */
export function buildStoreTheme(store: {
  brand_colors?: string[] | null;
  color_primary?: string;
  color_secondary?: string;
  color_accent?: string;
}): React.CSSProperties {
  const palette = resolveBrandColors(store);

  const [primary, background, accent, support1, support2] = palette;
  const vars: Record<string, string> = {};

  palette.forEach((color, index) => {
    vars[`--brand-${index + 1}`] = color;
  });

  vars["--brand-primary"] = primary;
  vars["--brand-secondary"] = background ?? primary;
  vars["--brand-accent"] = accent ?? primary;

  // Fundo real da página: o contraste do texto e do acento é medido contra ele (e não contra o
  // branco), porque a proprietária escolhe a cor de fundo.
  const backgroundHex = background ? ensureLightEnough(background) : DEFAULT_BACKGROUND_HEX;

  // O acento aparece em fios finos, focos e hovers — se for claro demais,
  // some contra o fundo. Preferimos a cor de destaque, mas caímos para a mais
  // saturada e escura da paleta quando ela não tem presença suficiente.
  const accentColor = pickAccent(palette, accent);
  vars["--gold"] = accentColor;

  // Quando o acento vira TEXTO (rótulos como "Sob encomenda", links), precisa de contraste de
  // leitura (4.5:1) contra o fundo. O acento decorativo (fios, foco) continua com a cor
  // escolhida; só o texto usa este tom, escurecido o mínimo necessário.
  vars["--gold-text"] = ensureContrast(accentColor, backgroundHex, 4.5);

  // A primária é usada em títulos e CTAs sólidos. Só sobrescreve o texto se a
  // cor for escura o bastante para manter contraste sobre o fundo claro —
  // uma primária pastel como texto deixaria a leitura ilegível. Mesmo escura, é
  // escurecida se não alcançar 4.5:1 contra o fundo escolhido.
  if (primary && isDarkEnoughForText(primary)) {
    const readable = ensureContrast(primary, backgroundHex, 4.5);
    vars["--foreground"] = readable;
    vars["--primary"] = readable;
  }

  // A segunda cor é o fundo real da página (pedido do usuário) — antes só
  // virava superfície de cards/chips, e uma cor escura era ignorada em
  // silêncio, sem nenhuma mudança visível no catálogo. Agora ela sempre se
  // aplica: se for escura demais para o texto continuar legível por cima,
  // `ensureLightEnough` clareia mantendo o matiz em vez de descartar a cor.
  if (background) {
    const bg = ensureLightEnough(background);
    vars["--background"] = bg;
    vars["--secondary"] = bg;
    vars["--muted"] = bg;
  }

  // Cores de apoio viram superfícies decorativas.
  if (support1) vars["--accent"] = support1;
  if (support2) vars["--brand-support"] = support2;

  return vars as React.CSSProperties;
}

// Fundo padrão do catálogo (pergaminho) quando a loja não escolheu um.
const DEFAULT_BACKGROUND_HEX = "#FAF8F5";

/**
 * Escurece a cor, mantendo o matiz, até ela ter o contraste mínimo contra o fundo. Cores que já
 * passam ficam exatamente como estão; valores que não são hex (ex.: o dourado padrão em oklch)
 * não são alterados.
 */
export function ensureContrast(hex: string, againstHex: string, minRatio: number): string {
  const current = contrastRatio(hex, againstHex);
  if (current === null || current >= minRatio) return hex;

  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  let lightness = hsl.l;
  let candidate = hex;
  while (lightness > 0.05) {
    lightness = Math.max(0.05, lightness - 0.02);
    candidate = hslToHex({ ...hsl, l: lightness });
    const ratio = contrastRatio(candidate, againstHex);
    if (ratio !== null && ratio >= minRatio) return candidate;
    if (lightness <= 0.05) break;
  }
  return candidate;
}

/**
 * Escolhe o acento visível. A 3ª cor tem precedência (é o papel declarado),
 * mas paletas suaves costumam ter tons claros nessa posição — aí buscamos na
 * paleta inteira a cor com melhor combinação de saturação e escuridão.
 */
function pickAccent(palette: string[], declared: string | undefined): string {
  if (declared && hasPresence(declared)) return declared;

  const candidates = palette
    .map((color) => ({ color, score: presenceScore(color) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  // Sem nenhuma cor com presença (paleta toda pastel), mantém a declarada
  // ou o dourado padrão do tema.
  return candidates[0]?.color ?? declared ?? "oklch(0.685 0.085 78)";
}

// Combina saturação e escuridão: uma cor precisa de ambas para "aparecer"
// como fio fino sobre fundo claro.
function presenceScore(hex: string): number {
  const rgb = toRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  const l = luminance(hex);
  if (l === null) return 0;

  const darkness = 1 - l;
  return saturation * 0.55 + darkness * 0.45;
}

function hasPresence(hex: string): boolean {
  return presenceScore(hex) >= 0.42;
}

function toRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;

  const int = parseInt(match[1], 16);
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  };
}

// Luminância relativa aproximada (sRGB), suficiente para decidir contraste.
function luminance(hex: string): number | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Escuro o bastante para servir de texto sobre fundo claro (~4.5:1). */
export function isDarkEnoughForText(hex: string): boolean {
  const l = luminance(hex);
  return l !== null && l < 0.22;
}

export function isLight(hex: string): boolean {
  const l = luminance(hex);
  return l !== null && l > 0.7;
}

/** Razão de contraste WCAG entre duas cores (1 a 21). AA para texto normal exige >= 4.5. */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const lA = luminance(hexA);
  const lB = luminance(hexB);
  if (lA === null || lB === null) return null;

  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}
