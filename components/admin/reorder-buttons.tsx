"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ReorderButtonsProps = {
  onMove: (direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  /** "vertical" para listas, "horizontal" para grades de imagem. */
  orientation?: "vertical" | "horizontal";
  label: string;
};

// Botões de mover em vez de arrastar: operável por toque e por teclado, sem
// depender de biblioteca de drag-and-drop.
export function ReorderButtons({
  onMove,
  isFirst,
  isLast,
  disabled,
  orientation = "vertical",
  label,
}: ReorderButtonsProps) {
  const horizontal = orientation === "horizontal";

  return (
    <div className={cn("flex gap-1", horizontal ? "flex-row" : "flex-col")}>
      <button
        type="button"
        onClick={() => onMove("up")}
        disabled={disabled || isFirst}
        aria-label={horizontal ? `Mover ${label} para a esquerda` : `Mover ${label} para cima`}
        className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground outline-none transition-colors hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronUpIcon className={cn("size-3.5", horizontal && "-rotate-90")} />
      </button>
      <button
        type="button"
        onClick={() => onMove("down")}
        disabled={disabled || isLast}
        aria-label={horizontal ? `Mover ${label} para a direita` : `Mover ${label} para baixo`}
        className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground outline-none transition-colors hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronDownIcon className={cn("size-3.5", horizontal && "-rotate-90")} />
      </button>
    </div>
  );
}
