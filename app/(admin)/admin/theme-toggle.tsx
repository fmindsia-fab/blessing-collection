"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useAdminTheme } from "./theme-provider";

export function ThemeToggle() {
  const { isDark, toggle } = useAdminTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={isDark}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
  );
}
