"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { DARK_MODE_STORAGE_KEY, DARK_MODE_VARS } from "@/lib/store/dark-mode";

type ThemeContextValue = {
  isDark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const subscribeToNothing = () => () => {};

function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

/**
 * Tema escuro só do painel administrativo (decisão do usuário: o catálogo
 * público mantém sempre a identidade visual da loja). Preferência por
 * navegador via localStorage — não é dado de negócio, não precisa do banco.
 *
 * Sobrescreve as variáveis de cor via `style` inline neste wrapper: o
 * `<body>` já aplica `buildStoreTheme` (paleta da loja) também via `style`,
 * e inline sempre vence regra de classe para a mesma custom property — por
 * isso o dark mode não pode depender só da classe `.dark` do CSS.
 *
 * Mesmo padrão de lib/selection/selection-context.tsx: inicialização
 * preguiçosa no useState (sem setState em efeito) + useSyncExternalStore só
 * para saber quando a hidratação terminou, evitando divergência entre o
 * HTML do servidor (sempre claro) e o primeiro render do cliente.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof window === "undefined" ? false : readStoredPreference(),
  );

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(DARK_MODE_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // Modo privado ou storage cheio: o tema segue funcionando na sessão.
    }
  }, [isDark, isHydrated]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      <div
        className={isDark ? "dark flex flex-1 flex-col" : "flex flex-1 flex-col"}
        style={isDark ? (DARK_MODE_VARS as React.CSSProperties) : undefined}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAdminTheme precisa estar dentro de AdminThemeProvider");
  return ctx;
}
