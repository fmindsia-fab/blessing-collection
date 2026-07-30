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
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors",
        selected
          ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
          : "border-zinc-300 text-zinc-900 hover:border-zinc-500",
        className,
      )}
    >
      {selected ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
      {selected ? "Na minha seleção" : "Adicionar à seleção"}
    </button>
  );
}
