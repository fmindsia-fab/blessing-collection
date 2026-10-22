import { describe, expect, it } from "vitest";
import { ADMIN_DARK_VARS, ADMIN_LIGHT_VARS } from "@/lib/store/admin-theme";

// Contraste WCAG 2.x entre as cores reais do painel (lib/store/admin-theme.ts).
// Texto normal pede 4.5:1 (AA); componentes visuais e texto grande pedem 3:1.

type Rgb = [number, number, number];

function parseOklch(value: string): { rgb: Rgb; alpha: number } {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%)?\s*\)/);
  if (!match) throw new Error(`Cor não reconhecida: ${value}`);
  const [L, C, H] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const alpha = match[4] ? Number(match[4]) / 100 : 1;

  // OKLCH -> OKLab -> sRGB linear -> sRGB (fórmulas de Björn Ottosson).
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin: Rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return { rgb: lin.map((c) => Math.min(1, Math.max(0, c))) as Rgb, alpha };
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b; // já em linear

function mix(top: { rgb: Rgb; alpha: number }, bottom: Rgb, extraAlpha = 1): Rgb {
  const a = top.alpha * extraAlpha;
  return top.rgb.map((c, i) => c * a + bottom[i] * (1 - a)) as Rgb;
}

function ratio(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function pair(vars: Record<string, string>, fgName: string, bgName: string, fgOpacity = 1): number {
  const bg = parseOklch(vars[bgName]);
  const fg = parseOklch(vars[fgName]);
  const bgRgb = bg.rgb; // fundos do painel são opacos
  return ratio(mix(fg, bgRgb, fgOpacity), bgRgb);
}

const THEMES = [
  ["claro", ADMIN_LIGHT_VARS],
  ["escuro", ADMIN_DARK_VARS],
] as const;

describe.each(THEMES)("contraste do painel (%s)", (_name, vars) => {
  it("texto principal sobre fundo e cartão: AA (4.5)", () => {
    expect(pair(vars, "--foreground", "--background")).toBeGreaterThanOrEqual(4.5);
    expect(pair(vars, "--card-foreground", "--card")).toBeGreaterThanOrEqual(4.5);
  });

  it("texto secundário (muted) sobre fundo, cartão e superfície suave: AA (4.5)", () => {
    expect(pair(vars, "--muted-foreground", "--background")).toBeGreaterThanOrEqual(4.5);
    expect(pair(vars, "--muted-foreground", "--card")).toBeGreaterThanOrEqual(4.5);
    expect(pair(vars, "--muted-foreground", "--secondary")).toBeGreaterThanOrEqual(4.5);
  });

  it("texto dos botões principais (sobre a cor da marca): AA (4.5)", () => {
    expect(pair(vars, "--primary-foreground", "--gold")).toBeGreaterThanOrEqual(4.5);
  });

  it("texto do menu lateral nas opacidades usadas (85% e 90%): AA (4.5)", () => {
    expect(pair(vars, "--sidebar-foreground", "--sidebar", 0.85)).toBeGreaterThanOrEqual(4.5);
    expect(pair(vars, "--sidebar-foreground", "--sidebar", 0.9)).toBeGreaterThanOrEqual(4.5);
  });

  it("cor da marca como texto/ícone sobre o fundo suave e o cartão: AA (4.5)", () => {
    expect(pair(vars, "--gold", "--brand-soft")).toBeGreaterThanOrEqual(4.5);
    expect(pair(vars, "--gold", "--card")).toBeGreaterThanOrEqual(4.5);
  });

  it("texto de erro (destructive) sobre o cartão: AA (4.5)", () => {
    expect(pair(vars, "--destructive", "--card")).toBeGreaterThanOrEqual(4.5);
  });

  it("anel de foco visível contra o fundo: ao menos 3", () => {
    expect(pair(vars, "--ring", "--background")).toBeGreaterThanOrEqual(3);
  });
});
