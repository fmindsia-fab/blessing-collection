"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CheckIcon, PackageOpenIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from "lucide-react";
import {
  createMaterial,
  toggleMaterial,
  updateMaterial,
  type PricingFormState,
} from "@/lib/pricing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { padCents } from "@/lib/admin/pad-cents";

type Material = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

const initialState: PricingFormState = {};

// Campo editável "discreto": parece texto até receber o mouse ou o foco, aí mostra a caixa.
// Salva ao sair do campo (sem botão por linha), com o aviso "Salvo" na própria linha.
const inlineInput =
  "h-10 border-transparent bg-transparent px-2.5 text-sm shadow-none hover:border-input focus-visible:bg-background";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Recebe só materiais ativos (a página já filtra na query): "removido" é soft
// delete no banco (regra do projeto: sem exclusão definitiva), mas some da
// tela — a proprietária pediu a lista limpa, sem os removidos misturados. Sem
// opção de restaurar pela lista; recadastrar é mais simples que reviver.
export function MaterialsList({ materials }: { materials: Material[] }) {
  const [state, formAction, isPending] = useActionState(createMaterial, initialState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  // Remoção em duas etapas na própria linha (no lugar da janela nativa confirm()).
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  // Linhas removidas: somem na hora (sem esperar o servidor) e voltam se a remoção falhar.
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  // Limpa o formulário depois de adicionar com sucesso (e só então).
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) formRef.current?.reset();
    wasPending.current = isPending;
  }, [isPending, state.error]);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    const visible = materials.filter((material) => !removedIds.includes(material.id));
    if (!needle) return visible;
    return visible.filter((material) => normalize(material.name).includes(needle));
  }, [materials, query, removedIds]);

  function save(id: string, fields: { name?: string; unit?: string; unitCost?: number }) {
    setSavingId(id);
    setSavedId(null);
    startTransition(async () => {
      await updateMaterial(id, fields);
      setSavingId(null);
      setSavedId(id);
      window.setTimeout(() => setSavedId((current) => (current === id ? null : current)), 2000);
    });
  }

  function remove(material: Material) {
    setConfirmingId(null);
    setRemovedIds((current) => [...current, material.id]);
    startTransition(async () => {
      try {
        await toggleMaterial(material.id, "active");
      } catch {
        setRemovedIds((current) => current.filter((id) => id !== material.id));
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Cadastro no topo: não some no fim de uma lista longa. */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Novo material</h2>
        <form
          ref={formRef}
          action={formAction}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_6rem_9rem_auto] sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mat-name">Nome</Label>
            <Input id="mat-name" name="name" required maxLength={80} placeholder="Ex.: Fio poliéster" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mat-unit">Unidade</Label>
            <Input id="mat-unit" name="unit" maxLength={10} defaultValue="un" />
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
              onBlur={(e) => padCents(e.target)}
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            <PlusIcon />
            {isPending ? "Salvando..." : "Adicionar"}
          </Button>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-4">
              {state.error}
            </p>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold tracking-tight">
              Seus materiais{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({materials.length - removedIds.filter((id) => materials.some((m) => m.id === id)).length})
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Clique no nome, na unidade ou no preço para editar; salva ao sair do campo. Reajustar o preço
              aqui atualiza todas as peças que usam o material.
            </p>
          </div>

          {materials.length > 5 ? (
            <div className="relative sm:w-64">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar material…"
                aria-label="Buscar material pelo nome"
                className="h-10 w-full rounded-full border border-input bg-card pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {materials.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--gold)]"
            >
              <PackageOpenIcon className="size-5" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Nenhum material ainda. Cadastre fio, fecho de imã, etiqueta, tag, alça… acima, uma vez só.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum material encontrado para &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Cabeçalho das colunas (só onde há espaço). */}
            <div className="hidden grid-cols-[1fr_6rem_9rem_7rem] gap-3 px-4 text-xs font-medium text-muted-foreground sm:grid">
              <span>Material</span>
              <span>Unidade</span>
              <span>Preço unitário</span>
              <span className="sr-only">Ações</span>
            </div>

            {filtered.map((material) => {
              const confirming = confirmingId === material.id;
              return (
                <div
                  key={material.id}
                  className={cn(
                    "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:border-[var(--gold)]/40 sm:grid-cols-[1fr_6rem_9rem_7rem] sm:px-4",
                    confirming && "border-destructive/50",
                  )}
                >
                  <Input
                    defaultValue={material.name}
                    maxLength={80}
                    aria-label={`Nome do material ${material.name}`}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (!value) {
                        e.target.value = material.name;
                        return;
                      }
                      if (value === material.name) return;
                      save(material.id, { name: value });
                    }}
                    className={cn(inlineInput, "font-medium")}
                  />

                  <div className="order-last col-span-2 grid grid-cols-[5rem_1fr] gap-2 sm:order-none sm:contents">
                    <Input
                      defaultValue={material.unit}
                      maxLength={10}
                      aria-label={`Unidade de ${material.name}`}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (!value) {
                          e.target.value = material.unit;
                          return;
                        }
                        if (value === material.unit) return;
                        save(material.id, { unit: value });
                      }}
                      className={inlineInput}
                    />

                    <div className="flex items-center gap-1.5">
                      <span aria-hidden className="text-sm text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={material.unit_cost ? material.unit_cost.toFixed(2) : ""}
                        placeholder="0,00"
                        aria-label={`Preço unitário de ${material.name}`}
                        onBlur={(e) => {
                          padCents(e.target);
                          const value = Number(e.target.value) || 0;
                          if (value === material.unit_cost) return;
                          save(material.id, { unitCost: value });
                        }}
                        className={cn(inlineInput, "tabular-nums")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    {confirming ? (
                      <>
                        <Button type="button" variant="destructive" size="xs" onClick={() => remove(material)}>
                          Remover
                        </Button>
                        <Button type="button" variant="ghost" size="xs" onClick={() => setConfirmingId(null)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <span
                          aria-live="polite"
                          className="flex min-w-14 items-center justify-end gap-1 text-xs text-muted-foreground"
                        >
                          {savingId === material.id ? (
                            "Salvando…"
                          ) : savedId === material.id ? (
                            <>
                              <CheckIcon className="size-3.5 text-[var(--gold)]" aria-hidden />
                              Salvo
                            </>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(material.id)}
                          aria-label={`Remover ${material.name}`}
                          className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
