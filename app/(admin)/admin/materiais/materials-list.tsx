"use client";

import { useActionState, useTransition } from "react";
import { TrashIcon } from "lucide-react";
import {
  createMaterial,
  toggleMaterial,
  updateMaterial,
  type PricingFormState,
} from "@/lib/pricing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/admin/status-pill";
import type { ArchivableStatus } from "@/types/database.types";

type Material = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
  status: ArchivableStatus;
};

const initialState: PricingFormState = {};

export function MaterialsList({ materials }: { materials: Material[] }) {
  const [state, formAction, isPending] = useActionState(createMaterial, initialState);
  const [isSaving, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">
        Clique em nome, unidade ou preço para editar — salva ao sair do campo. O preço aqui alimenta
        a formação de preço de toda peça que usar este material: reajustar uma vez atualiza todas de
        uma vez.
      </p>

      {materials.length > 0 ? (
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {materials.map((material) => {
            const isArchived = material.status === "archived";

            return (
              <div key={material.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* Salva ao sair do campo: evita um botão por linha. */}
                  <Input
                    defaultValue={material.name}
                    maxLength={80}
                    aria-label={`Nome do material ${material.name}`}
                    disabled={isSaving}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (!value || value === material.name) return;
                      startTransition(() => updateMaterial(material.id, { name: value }));
                    }}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {isArchived ? <StatusPill tone="muted">Removido</StatusPill> : null}

                  <div className="flex items-center gap-1">
                    <Input
                      defaultValue={material.unit}
                      maxLength={10}
                      aria-label={`Unidade de ${material.name}`}
                      disabled={isSaving}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (!value || value === material.unit) return;
                        startTransition(() => updateMaterial(material.id, { unit: value }));
                      }}
                      className="h-8 w-16 text-center text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={material.unit_cost || ""}
                      placeholder="0,00"
                      aria-label={`Preço unitário de ${material.name}`}
                      disabled={isSaving}
                      onBlur={(e) => {
                        const value = Number(e.target.value) || 0;
                        if (value === material.unit_cost) return;
                        startTransition(() => updateMaterial(material.id, { unitCost: value }));
                      }}
                      className="h-8 w-24 text-right tabular-nums"
                    />
                  </div>

                  {isArchived ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={isSaving}
                      onClick={() => startTransition(() => toggleMaterial(material.id, material.status))}
                    >
                      Restaurar
                    </Button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        // Soft delete (regra do projeto: sem exclusão definitiva)
                        // — o material some do seletor de peça nova, mas as
                        // peças que já o usam continuam com o vínculo intacto.
                        if (!confirm(`Remover "${material.name}" do catálogo de materiais?`)) return;
                        startTransition(() => toggleMaterial(material.id, material.status));
                      }}
                      aria-label={`Remover ${material.name}`}
                      className="flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-destructive focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[var(--radius)] border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          Fio, fecho de imã, etiqueta, tag, alça… cadastre cada um abaixo.
        </p>
      )}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mat-name">Novo material</Label>
          <Input id="mat-name" name="name" required maxLength={80} placeholder="Fio poliéster" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mat-unit">Unidade</Label>
          <Input id="mat-unit" name="unit" maxLength={10} defaultValue="un" className="w-20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mat-cost">Preço unitário (R$)</Label>
          <Input
            id="mat-cost"
            name="unitCost"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            className="w-28"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending} className="self-end">
          {isPending ? "Salvando..." : "Adicionar"}
        </Button>

        {state.error ? (
          <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>
        ) : null}
      </form>
    </div>
  );
}
