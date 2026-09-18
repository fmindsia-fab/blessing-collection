/**
 * Variáveis do tema escuro do painel — cinza neutro puro, sem nenhuma
 * relação com a paleta da marca (decisão do usuário: a primeira versão
 * tentava uma paleta "café escuro" derivada do editorial e ficou estranha —
 * o escuro do painel deve ser neutro, não uma adaptação da identidade
 * visual da loja).
 *
 * Precisa ser inline, não só a classe `.dark`: `buildStoreTheme` já define
 * --background/--foreground/etc via `style` no <body> (para refletir a
 * paleta da loja), e CSS custom properties em `style` inline sempre vencem
 * as mesmas variáveis vindas de uma regra de classe, não importa a
 * especificidade do seletor. Um wrapper mais interno precisa repetir a
 * sobrescrita via `style` para realmente vencer — e por isso também precisa
 * sobrescrever `--gold`, que a paleta da loja customiza via a mesma técnica.
 */
export const DARK_MODE_VARS: Record<string, string> = {
  "--background": "oklch(0.16 0 0)",
  "--foreground": "oklch(0.94 0 0)",
  "--card": "oklch(0.21 0 0)",
  "--card-foreground": "oklch(0.94 0 0)",
  "--popover": "oklch(0.21 0 0)",
  "--popover-foreground": "oklch(0.94 0 0)",
  "--primary": "oklch(0.92 0 0)",
  "--primary-foreground": "oklch(0.21 0 0)",
  "--secondary": "oklch(0.27 0 0)",
  "--secondary-foreground": "oklch(0.94 0 0)",
  "--muted": "oklch(0.27 0 0)",
  "--muted-foreground": "oklch(0.65 0 0)",
  "--accent": "oklch(0.32 0 0)",
  "--accent-foreground": "oklch(0.94 0 0)",
  "--destructive": "oklch(0.65 0.19 22)",
  "--border": "oklch(1 0 0 / 12%)",
  "--input": "oklch(1 0 0 / 16%)",
  "--ring": "oklch(0.55 0 0)",
  "--gold": "oklch(0.75 0 0)",
};

export const DARK_MODE_STORAGE_KEY = "blessing-admin-theme";
