"use client";

import { useState, useTransition } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { quickCreateCatalogItem, type QuickCreateKind } from "@/lib/catalog/quick-create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Option = { id: string; name: string };

// Select de categoria/coleção/modelo com um "+" ao lado para criar o item na
// hora, sem sair do cadastro do produto. Fica DENTRO do <form> do produto,
// então não usa <form> próprio: Enter no campo é tratado à mão para não
// enviar o produto por engano.
export function QuickCreateSelect({
  kind,
  id,
  name,
  label,
  emptyLabel,
  noun,
  options: initialOptions,
  defaultValue,
}: {
  kind: QuickCreateKind;
  id: string;
  name: string;
  label: string;
  emptyLabel: string;
  noun: string;
  options: Option[];
  defaultValue: string;
}) {
  const [options, setOptions] = useState(initialOptions);
  const [value, setValue] = useState(defaultValue);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setAdding(false);
    setNewName("");
    setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await quickCreateCatalogItem(kind, newName);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOptions((prev) => [...prev, result.item].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setValue(result.item.id);
      close();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <NativeSelect id={id} name={name} value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">{emptyLabel}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          aria-label={`Cadastrar ${noun} nova`}
          aria-expanded={adding}
          title={`Cadastrar ${noun}`}
          onClick={() => (adding ? close() : setAdding(true))}
        >
          {adding ? <XIcon aria-hidden /> : <PlusIcon aria-hidden />}
        </Button>
      </div>

      {adding ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newName.trim() && !isPending) submit();
                }
                if (e.key === "Escape") close();
              }}
              placeholder={`Nome d${noun === "modelo" ? "o" : "a"} ${noun}`}
              maxLength={80}
              aria-label={`Nome d${noun === "modelo" ? "o" : "a"} ${noun}`}
            />
            <Button type="button" onClick={submit} disabled={isPending || !newName.trim()}>
              {isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
