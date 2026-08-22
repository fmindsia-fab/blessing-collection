// Gera uma paleta harmônica de 5 cores a partir de uma cor base — pedido do
// usuário: escolher a primária e ter fundo/destaque/apoio sugeridos de forma
// coerente, sem precisar entender teoria de cor pra montar a paleta na mão.

type HSL = { h: number; s: number; l: number };

function hexToHsl(hex: string): HSL | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
}

function hslToHex({ h, s, l }: HSL): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp01(s);
  const lig = clamp01(l);

  if (sat === 0) {
    const v = Math.round(lig * 255);
    return toHex(v, v, v);
  }

  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
  const p = 2 * lig - q;

  const toChannel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const r = Math.round(toChannel(hue / 360 + 1 / 3) * 255);
  const g = Math.round(toChannel(hue / 360) * 255);
  const b = Math.round(toChannel(hue / 360 - 1 / 3) * 255);

  return toHex(r, g, b);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toHex(r: number, g: number, b: number): string {
  const clamp255 = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * Paleta de 5 papéis a partir de uma cor primária:
 * [primária, fundo, destaque, apoio, apoio].
 *
 * - Fundo: mesmo matiz da primária, quase sem saturação e bem claro — claro o
 *   bastante pra `isLight()` (lib/store/theme.ts) aceitar como fundo real, em
 *   vez de ser ignorado como hoje acontece com uma 2ª cor escura.
 * - Destaque: matiz complementar (+180°), saturado e de luminância média —
 *   contrasta com a primária sem competir por atenção com ela.
 * - Apoio 1: análogo à primária (+30°), mais claro — variação da própria cor.
 * - Apoio 2: análogo ao destaque (-30°), mais claro — para textura/fundos
 *   decorativos sem repetir a primária.
 */
export function generateHarmoniousPalette(baseHex: string): string[] {
  const base = hexToHsl(baseHex);
  if (!base) return [baseHex, "#FAF8F5", "#C9A227", "#D9C5B2", "#EFE6DA"];

  const background = hslToHex({ h: base.h, s: Math.min(base.s, 0.12), l: 0.96 });
  const accent = hslToHex({ h: base.h + 180, s: Math.max(base.s, 0.45), l: 0.5 });
  const support1 = hslToHex({ h: base.h + 30, s: base.s * 0.6, l: Math.min(base.l + 0.3, 0.85) });
  const support2 = hslToHex({ h: base.h - 30, s: base.s * 0.5, l: Math.min(base.l + 0.35, 0.9) });

  return [baseHex.toUpperCase(), background, accent, support1, support2];
}
