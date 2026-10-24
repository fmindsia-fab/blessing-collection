"use client";

import { CheckIcon, PlusIcon } from "lucide-react";
import { useSelection, type SelectedItem } from "@/lib/selection/selection-context";
import { cn } from "@/lib/utils";

type SelectionToggleButtonProps = {
  item: SelectedItem;
  className?: string;
  /** Escolha obrigatória pendente: não dá para pôr na sacola ainda (tirar da sacola sempre pode). */
  disabledReason?: string;
};

export function SelectionToggleButton({ item, className, disabledReason }: SelectionToggleButtonProps) {
  const { isSelected, toggle } = useSelection();
  const selected = isSelected(item.productId);
  const blocked = Boolean(disabledReason) && !selected;

  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      disabled={blocked}
      title={blocked ? disabledReason : undefined}
      aria-pressed={selected}
      className={cn(
        // Mesma métrica do actionVariants "outline", mas com estado selecionado
        // próprio — por isso não reusa a variante diretamente.
        "group inline-flex h-12 items-center justify-center gap-2.5 border px-8 text-xs uppercase tracking-[0.18em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        selected
          ? "border-[var(--gold)] bg-[var(--gold)]/12 text-foreground"
          : "border-foreground/30 text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        blocked && "cursor-not-allowed opacity-50 hover:border-foreground/30 hover:bg-transparent hover:text-foreground",
        className,
      )}
    >
      {selected ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
      {selected ? "Na minha sacola" : "Adicionar à sacola"}
    </button>
  );
}
