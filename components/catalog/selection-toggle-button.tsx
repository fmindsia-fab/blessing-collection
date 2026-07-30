"use client";

import { CheckIcon, PlusIcon } from "lucide-react";
import { useSelection, type SelectedItem } from "@/lib/selection/selection-context";
import { cn } from "@/lib/utils";

type SelectionToggleButtonProps = {
  item: SelectedItem;
  className?: string;
};

export function SelectionToggleButton({ item, className }: SelectionToggleButtonProps) {
  const { isSelected, toggle } = useSelection();
  const selected = isSelected(item.productId);

  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={selected}
      className={cn(
        // Mesma métrica do actionVariants "outline", mas com estado selecionado
        // próprio — por isso não reusa a variante diretamente.
        "group inline-flex h-12 items-center justify-center gap-2.5 border px-8 text-[0.6875rem] uppercase tracking-[0.18em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        selected
          ? "border-[var(--gold)] bg-[var(--gold)]/12 text-foreground"
          : "border-foreground/30 text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        className,
      )}
    >
      {selected ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
      {selected ? "Na minha seleção" : "Adicionar à seleção"}
    </button>
  );
}
