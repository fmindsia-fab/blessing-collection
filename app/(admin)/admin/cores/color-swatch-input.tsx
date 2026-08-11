"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { isValidHexColor } from "@/lib/store/branding";
import { Label } from "@/components/ui/label";

/**
 * Seletor de cor + campo de texto, como na paleta da marca: o seletor cobre
 * quem escolhe visualmente, o texto cobre quem já tem o código pronto.
 */
export function ColorSwatchInput({
  id,
  name,
  label,
  defaultValue,
  onRemove,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  onRemove?: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const valid = isValidHexColor(value);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={`Seletor visual: ${label.toLowerCase()}`}
          value={valid ? value : "#000000"}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          className="size-10 shrink-0 cursor-pointer rounded-[var(--radius)] border border-border bg-transparent p-1"
        />
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="#C3B3D6"
          maxLength={7}
          spellCheck={false}
          className="w-32 rounded-[var(--radius)] border border-input bg-background px-3 py-2 font-mono text-sm uppercase outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
        />
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${label.toLowerCase()}`}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>
      {!valid && value ? (
        <p className="text-xs text-destructive">Use o formato #C3B3D6.</p>
      ) : null}
    </div>
  );
}
