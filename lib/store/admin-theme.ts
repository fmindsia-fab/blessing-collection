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
  "--background": "oklch(0.985 0.002 260)",
  "--foreground": "oklch(0.2 0.015 265)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.2 0.015 265)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0.2 0.015 265)",
  "--primary": "oklch(0.2 0.015 265)",
  "--primary-foreground": "oklch(0.98 0.003 260)",
  "--secondary": "oklch(0.955 0.005 260)",
  "--secondary-foreground": "oklch(0.2 0.015 265)",
  "--muted": "oklch(0.955 0.005 260)",
  "--muted-foreground": "oklch(0.48 0.012 265)",
  "--accent": "oklch(0.93 0.015 265)",
  "--accent-foreground": "oklch(0.2 0.015 265)",
  "--destructive": "oklch(0.577 0.179 25)",
  "--border": "oklch(0.9 0.006 260)",
  "--input": "oklch(0.9 0.006 260)",
  "--ring": "oklch(0.55 0.14 275)",
  // Acento indigo/violeta da plataforma — substitui o dourado --gold.
  "--gold": "oklch(0.55 0.14 275)",
};

export const ADMIN_DARK_VARS: Record<string, string> = {
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
  "--ring": "oklch(0.65 0.14 275)",
  // Mesma família indigo/violeta do claro, ajustada para contraste no escuro.
  "--gold": "oklch(0.65 0.14 275)",
};

export const DARK_MODE_STORAGE_KEY = "blessing-admin-theme";
