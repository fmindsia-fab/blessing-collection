/**
 * Paleta do painel administrativo — neutra, própria da plataforma Ateliê
 * Fácil, independente da marca de qualquer loja logada. Decisão do usuário
 * (reforma visual multi-tenant): o admin não deve mais herdar a identidade
 * visual "editorial pergaminho"/dourado do catálogo público — cada artesã
 * usa o mesmo painel, então ele precisa de uma cara própria e consistente.
 *
 * Substitui lib/store/dark-mode.ts (só cobria o escuro). Precisa ser
 * aplicado via `style` inline, não só a classe `.dark`: o `<body>` já define
 * --background/--foreground/etc via `style` inline em buildStoreTheme(store)
 * (app/layout.tsx), e CSS custom properties em `style` inline sempre vencem
 * as mesmas variáveis vindas de uma regra de classe, não importa a
 * especificidade do seletor. Ver app/(admin)/admin/theme-provider.tsx, que
 * aplica ADMIN_LIGHT_VARS/ADMIN_DARK_VARS sempre, claro ou escuro.
 */
export const ADMIN_LIGHT_VARS: Record<string, string> = {
  // Identidade AteliFácil (derivada do logo): terracota/cobre sobre off-white quente.
  "--background": "oklch(0.975 0.006 70)",
  "--foreground": "oklch(0.26 0.02 50)",
  "--card": "oklch(0.995 0.003 70)",
  "--card-foreground": "oklch(0.26 0.02 50)",
  "--popover": "oklch(0.995 0.003 70)",
  "--popover-foreground": "oklch(0.26 0.02 50)",
  "--primary": "oklch(0.3 0.04 40)",
  "--primary-foreground": "oklch(0.985 0.005 70)",
  "--secondary": "oklch(0.95 0.012 65)",
  "--secondary-foreground": "oklch(0.3 0.04 40)",
  "--muted": "oklch(0.95 0.012 65)",
  "--muted-foreground": "oklch(0.5 0.02 55)",
  "--accent": "oklch(0.93 0.025 55)",
  "--accent-foreground": "oklch(0.3 0.04 40)",
  "--destructive": "oklch(0.55 0.18 25)",
  "--border": "oklch(0.91 0.012 65)",
  "--input": "oklch(0.9 0.014 65)",
  "--ring": "oklch(0.56 0.13 40)",
  // Terracota da marca: botões principais, foco e destaques (substitui o dourado/indigo).
  "--gold": "oklch(0.54 0.13 40)",
  "--brand-soft": "oklch(0.93 0.03 55)",
  "--sidebar": "oklch(0.965 0.012 65)",
  "--sidebar-foreground": "oklch(0.3 0.03 45)",
  "--sidebar-border": "oklch(0.91 0.014 65)",
};

export const ADMIN_DARK_VARS: Record<string, string> = {
  // Marrom/grafite profundo (nunca preto absoluto), com cobre suavizado.
  "--background": "oklch(0.2 0.012 45)",
  "--foreground": "oklch(0.94 0.008 70)",
  "--card": "oklch(0.245 0.014 45)",
  "--card-foreground": "oklch(0.94 0.008 70)",
  "--popover": "oklch(0.26 0.014 45)",
  "--popover-foreground": "oklch(0.94 0.008 70)",
  "--primary": "oklch(0.93 0.01 70)",
  "--primary-foreground": "oklch(0.22 0.012 45)",
  "--secondary": "oklch(0.29 0.015 45)",
  "--secondary-foreground": "oklch(0.94 0.008 70)",
  "--muted": "oklch(0.29 0.015 45)",
  "--muted-foreground": "oklch(0.72 0.02 60)",
  "--accent": "oklch(0.33 0.02 45)",
  "--accent-foreground": "oklch(0.94 0.008 70)",
  "--destructive": "oklch(0.68 0.17 25)",
  "--border": "oklch(1 0 0 / 10%)",
  "--input": "oklch(1 0 0 / 14%)",
  "--ring": "oklch(0.72 0.11 45)",
  "--gold": "oklch(0.7 0.115 45)",
  "--brand-soft": "oklch(0.32 0.04 45)",
  "--sidebar": "oklch(0.17 0.012 45)",
  "--sidebar-foreground": "oklch(0.92 0.01 70)",
  "--sidebar-border": "oklch(1 0 0 / 8%)",
};

export const DARK_MODE_STORAGE_KEY = "blessing-admin-theme";
// Cookie espelho da preferência: o servidor lê para renderizar o tema certo já no primeiro paint.
export const DARK_MODE_COOKIE = "atelifacil-admin-theme";

// Tamanho do texto do painel (acessibilidade): escala o rem do <html>, então tudo que
// usa rem (textos, botões, espaços, sidebar) cresce junto. Guardado em cookie para o
// servidor já renderizar no tamanho certo, sem "pular" depois de carregar.
export const TEXT_SIZE_COOKIE = "atelifacil-text-size";
export const TEXT_SIZES = ["normal", "large", "xlarge"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const TEXT_SIZE_PERCENT: Record<TextSize, number> = { normal: 100, large: 112.5, xlarge: 125 };
export const TEXT_SIZE_LABEL: Record<TextSize, string> = {
  normal: "Normal",
  large: "Grande",
  xlarge: "Muito grande",
};

export function parseTextSize(value: string | undefined): TextSize {
  return (TEXT_SIZES as readonly string[]).includes(value ?? "") ? (value as TextSize) : "normal";
}
