"use client";

import { useState } from "react";
import {
  TEXT_SIZES,
  TEXT_SIZE_COOKIE,
  TEXT_SIZE_LABEL,
  TEXT_SIZE_PERCENT,
  type TextSize,
} from "@/lib/store/admin-theme";
import { cn } from "@/lib/utils";

const SYMBOL: Record<TextSize, string> = { normal: "A", large: "A+", xlarge: "A++" };

// Botão único que alterna o tamanho do texto do painel (Normal → Grande → Muito grande).
// Aplica na hora no <html> e grava em cookie; o servidor lê o cookie no próximo carregamento.
export function TextSizeControl({ initial }: { initial: TextSize }) {
  const [size, setSize] = useState<TextSize>(initial);
  const next = TEXT_SIZES[(TEXT_SIZES.indexOf(size) + 1) % TEXT_SIZES.length];

  function cycle() {
    setSize(next);
    document.documentElement.style.fontSize = `${TEXT_SIZE_PERCENT[next]}%`;
    document.cookie = `${TEXT_SIZE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Tamanho do texto: ${TEXT_SIZE_LABEL[size]}. Clique para mudar para ${TEXT_SIZE_LABEL[next]}.`}
      aria-label={`Tamanho do texto: ${TEXT_SIZE_LABEL[size]}. Clique para mudar para ${TEXT_SIZE_LABEL[next]}.`}
      className="flex h-10 min-w-10 items-center justify-center rounded-full border border-border bg-card px-2.5 font-semibold text-muted-foreground outline-none transition-colors hover:border-[var(--gold)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
    >
      <span className={cn(size === "normal" ? "text-sm" : size === "large" ? "text-base" : "text-lg")} aria-hidden>
        {SYMBOL[size]}
      </span>
    </button>
  );
}
