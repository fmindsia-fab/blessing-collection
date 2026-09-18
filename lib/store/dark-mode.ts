/**
 * Variáveis do tema escuro do painel — mesmos valores de `.dark` em
 * globals.css, repetidos aqui para sobrescrever via `style` inline.
 *
 * Precisa ser inline, não só a classe `.dark`: `buildStoreTheme` já define
 * --background/--foreground/etc via `style` no <body> (para refletir a
 * paleta da loja), e CSS custom properties em `style` inline sempre vencem
 * as mesmas variáveis vindas de uma regra de classe, não importa a
 * especificidade do seletor. Um wrapper mais interno precisa repetir a
 * sobrescrita via `style` para realmente vencer.
 */
export const DARK_MODE_VARS: Record<string, string> = {
  "--background": "oklch(0.195 0.014 45)",
  "--foreground": "oklch(0.945 0.012 70)",
  "--card": "oklch(0.235 0.016 45)",
  "--card-foreground": "oklch(0.945 0.012 70)",
  "--popover": "oklch(0.235 0.016 45)",
  "--popover-foreground": "oklch(0.945 0.012 70)",
  "--primary": "oklch(0.905 0.028 75)",
  "--primary-foreground": "oklch(0.235 0.016 45)",
  "--secondary": "oklch(0.285 0.018 48)",
  "--secondary-foreground": "oklch(0.945 0.012 70)",
  "--muted": "oklch(0.285 0.018 48)",
  "--muted-foreground": "oklch(0.665 0.02 60)",
  "--accent": "oklch(0.325 0.024 55)",
  "--accent-foreground": "oklch(0.945 0.012 70)",
  "--destructive": "oklch(0.645 0.165 25)",
  "--border": "oklch(1 0 0 / 10%)",
  "--input": "oklch(1 0 0 / 15%)",
  "--ring": "oklch(0.685 0.085 78)",
  "--gold": "oklch(0.735 0.095 78)",
};

export const DARK_MODE_STORAGE_KEY = "blessing-admin-theme";
