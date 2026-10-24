"use client";

import { CheckIcon, PlusIcon } from "lucide-react";
import { useSelection, type SelectedItem } from "@/lib/selection/selection-context";
import { cn } from "@/lib/utils";

// Atalho no cartão da peça para pôr (ou tirar) a peça da sacola sem abrir a página dela.
// Só aparece em peças sem variações: nas outras a cliente precisa escolher cor, alça etc.,
// então o caminho certo é abrir a peça. Fica sempre visível (não depende de hover, que não
// existe no celular).
export function AddToBagButton({ item }: { item: SelectedItem }) {
  const { isSelected, toggle, isHydrated } = useSelection();
  const inBag = isHydrated && isSelected(item.productId);

  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={inBag}
      aria-label={inBag ? `Tirar ${item.name} da sacola` : `Adicionar ${item.name} à sacola`}
      title={inBag ? "Na sua sacola. Toque para tirar" : "Adicionar à sacola"}
      className={cn(
        "absolute right-2.5 top-2.5 z-10 flex size-10 items-center justify-center rounded-full border shadow-sm outline-none backdrop-blur-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        inBag
          ? "border-[var(--gold)] bg-[var(--gold)] text-primary-foreground"
          : "border-border bg-background/92 text-foreground hover:border-foreground",
      )}
    >
      {inBag ? <CheckIcon className="size-5" /> : <PlusIcon className="size-5" />}
    </button>
  );
}
