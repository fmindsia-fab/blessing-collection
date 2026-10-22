"use client";

import { useActionState, useState, useTransition } from "react";
import { TrashIcon } from "lucide-react";
import {
  createVariantGroup,
  archiveVariantGroup,
  renameVariantGroup,
  type VariantGroupFormState,
} from "@/lib/variant-groups/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type VariantGroup = {
  id: string;
  name: string;
};

const initialState: VariantGroupFormState = {};

// Recebe só grupos ativos (a página já filtra na query) — mesmo padrão da
// tela de Materiais: "removido" é soft delete no banco (regra do projeto),
// mas some da lista aqui. Sem opção de restaurar pela lista; recadastrar é
// mais simples que reviver.
export function VariantGroupsList({ groups }: { groups: VariantGroup[] }) {
  const [state, formAction, isPending] = useActionState(createVariantGroup, initialState);
  const [isSaving, startTransition] = useTransition();
  const [removing, setRemoving] = useState<VariantGroup | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">
        Clique no nome para editar — salva ao sair do campo. Os grupos aparecem como sugestão ao
        cadastrar uma variação em qualquer peça (Cor, Alça, Tamanho…), mas você pode digitar um
        nome novo direto lá também.
      </p>

      {groups.length > 0 ? (
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between gap-4 py-3">
              <Input
                defaultValue={group.name}
                maxLength={30}
                aria-label={`Nome do grupo ${group.name}`}
                disabled={isSaving}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (!value || value === group.name) return;
                  startTransition(() => renameVariantGroup(group.id, value));
                }}
                className="h-8 max-w-xs text-sm"
              />

              <button
                type="button"
                disabled={isSaving}
                onClick={() => setRemoving(group)}
                aria-label={`Remover ${group.name}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-destructive focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius)] border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          Cor, Alça, Tamanho, Acabamento… cadastre cada eixo de variação abaixo.
        </p>
      )}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vg-name">Novo grupo</Label>
          <Input id="vg-name" name="name" required maxLength={30} placeholder="Alça" />
        </div>
        <Button type="submit" variant="outline" disabled={isPending} className="self-end">
          {isPending ? "Salvando..." : "Adicionar"}
        </Button>

        {state.error ? <p className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
      </form>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={`Remover ${removing?.name ?? "grupo"}?`}
        description="Ele sai desta lista. As peças que já usam esta opção continuam como estão."
        onConfirm={() => {
          if (removing) startTransition(() => archiveVariantGroup(removing.id));
        }}
      />
    </div>
  );
}
