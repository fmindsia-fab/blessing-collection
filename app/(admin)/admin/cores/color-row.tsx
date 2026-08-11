"use client";

import { useActionState, useState, useTransition } from "react";
import { archiveColor, restoreColor, updateColor, type ColorFormState } from "@/lib/colors/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/admin/status-pill";
import { ColorSwatchInput } from "./color-swatch-input";
import type { ArchivableStatus } from "@/types/database.types";

type Color = {
  id: string;
  name: string;
  slug: string;
  hex: string;
  hex_secondary: string | null;
  status: ArchivableStatus;
};

const initialState: ColorFormState = {};

/** Amostra igual à do catálogo — o que a proprietária vê aqui é o que sai lá. */
export function Swatch({ hex, hexSecondary }: { hex: string; hexSecondary: string | null }) {
  return (
    <span
      aria-hidden
      className="size-8 shrink-0 rounded-full border border-foreground/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]"
      style={
        hexSecondary
          ? { background: `linear-gradient(135deg, ${hex} 50%, ${hexSecondary} 50%)` }
          : { backgroundColor: hex }
      }
    />
  );
}

export function ColorRow({ color }: { color: Color }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isArchived = color.status === "archived";

  const saveAction = updateColor.bind(null, color.id);
  const [state, formAction, isSaving] = useActionState(saveAction, initialState);

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          formAction(formData);
          setIsEditing(false);
        }}
        className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-foreground/25 bg-card p-5 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`name-${color.id}`}>Nome</Label>
          <Input
            id={`name-${color.id}`}
            name="name"
            defaultValue={color.name}
            required
            maxLength={60}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <ColorSwatchInput
            id={`hex-${color.id}`}
            name="hex"
            label="Cor"
            defaultValue={color.hex}
          />
          <ColorSwatchInput
            id={`hex2-${color.id}`}
            name="hexSecondary"
            label="Segunda cor"
            defaultValue={color.hex_secondary ?? ""}
          />
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-image)] border border-border bg-card px-5 py-4 shadow-sm transition-all duration-300 hover:border-foreground/25 hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <Swatch hex={color.hex} hexSecondary={color.hex_secondary} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-[family-name:var(--font-brand)] text-base">{color.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {color.hex}
            {color.hex_secondary ? ` · ${color.hex_secondary}` : ""}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isArchived ? <StatusPill tone="muted">Arquivada</StatusPill> : null}
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isArchived ? restoreColor(color.id) : archiveColor(color.id)))
          }
        >
          {isArchived ? "Restaurar" : "Arquivar"}
        </Button>
      </div>
    </div>
  );
}
