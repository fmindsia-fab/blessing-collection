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
        "inline-flex h-12 items-center justify-center gap-2 border px-6 text-xs uppercase tracking-[0.18em] transition-colors",
        selected
          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-foreground"
          : "border-foreground/25 text-foreground hover:border-foreground",
        className,
      )}
    >
      {selected ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
      {selected ? "Na minha seleção" : "Adicionar à seleção"}
    </button>
  );
}
