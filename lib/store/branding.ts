// A lista curada de fontes vive em lib/store/fonts.ts, junto das chamadas ao
// next/font/google — aqui ficam apenas cores e validações de branding.

// Cor hex de 6 dígitos, com #. O mesmo formato aceito pelo input type="color".
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export const MAX_BRAND_COLORS = 5;

/**
 * Só aceita URL do próprio Supabase Storage, no bucket de fontes.
 * A URL é interpolada num @font-face via dangerouslySetInnerHTML, então uma
 * string arbitrária vinda do banco poderia fechar a regra CSS e injetar
 * conteúdo. Validar a origem fecha isso na raiz.
 */
export function isSafeBrandFontUrl(url: string | null | undefined): url is string {
  if (!url) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    const parsed = new URL(url);
    const expected = new URL(supabaseUrl);

    return (
      parsed.protocol === "https:" &&
      parsed.host === expected.host &&
      parsed.pathname.includes("/brand-fonts/") &&
      parsed.pathname.endsWith(".woff2")
    );
  } catch {
    return false;
  }
}

// Aceita colagem em qualquer formato comum ("c9a227", "#C9A227 ", "C9A227")
// e devolve sempre #RRGGBB em maiúsculas. Sem isso, colar do Figma/Photoshop
// (que costuma omitir o #) marcaria o campo como inválido.
export function normalizeHexInput(raw: string): string {
  const cleaned = raw.trim().replace(/^#/, "").replace(/[^0-9a-fA-F]/g, "");
  return `#${cleaned.slice(0, 6).toUpperCase()}`;
}

// Paleta padrão: preto-tinta, pergaminho e dourado envelhecido.
export const DEFAULT_BRAND_COLORS = ["#1C1917", "#FAF8F5", "#C9A227"];

// Lê a paleta do banco com fallback para as 3 colunas antigas, para a loja
// continuar funcionando mesmo antes da migration 0009 ser aplicada.
export function resolveBrandColors(store: {
  brand_colors?: string[] | null;
  color_primary?: string;
  color_secondary?: string;
  color_accent?: string;
}): string[] {
  const fromArray = store.brand_colors?.filter(isValidHexColor) ?? [];
  if (fromArray.length > 0) return fromArray.slice(0, MAX_BRAND_COLORS);

  const legacy = [store.color_primary, store.color_secondary, store.color_accent].filter(
    (c): c is string => typeof c === "string" && isValidHexColor(c),
  );

  return legacy.length > 0 ? legacy : DEFAULT_BRAND_COLORS;
}

// Valida a paleta inteira antes de gravar (espelha o check da migration 0009).
export function parseBrandColors(raw: string): { colors: string[] } | { error: string } {
  const colors = raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (colors.length === 0) return { error: "Informe ao menos uma cor da marca." };
  if (colors.length > MAX_BRAND_COLORS) {
    return { error: `A paleta aceita no máximo ${MAX_BRAND_COLORS} cores.` };
  }

  const invalid = colors.find((c) => !isValidHexColor(c));
  if (invalid) return { error: `Cor inválida: ${invalid}. Use o formato #RRGGBB.` };

  return { colors };
}
