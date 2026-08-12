"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Grupo de peças de uma categoria, recolhível.
 *
 * Com 19 peças numa lista única, achar uma exigia rolar a página inteira.
 * Começa aberto: recolher é a exceção, e uma tela que abre toda fechada
 * esconde o conteúdo de quem só quer conferir o catálogo.
 */
export function CategoryGroup({
  name,
  count,
  defaultOpen = true,
  children,
}: {
  name: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex items-center gap-3 rounded-[var(--radius)] px-1 py-2 text-left outline-none transition-colors hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
      >
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
            !open && "-rotate-90",
          )}
        />
        <span className="font-[family-name:var(--font-brand)] text-lg">{name}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {count} {count === 1 ? "peça" : "peças"}
        </span>
        <span aria-hidden className="ml-1 h-px flex-1 bg-border" />
      </button>

      {open ? <div className="flex flex-col gap-3">{children}</div> : null}
    </section>
  );
}
