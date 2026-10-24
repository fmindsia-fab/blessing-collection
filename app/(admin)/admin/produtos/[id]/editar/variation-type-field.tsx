"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

const OTHER = "__other__";

// Opções que sempre existem, mesmo com o catálogo de variações ainda vazio.
const BASE_OPTIONS = ["Cor", "Alça", "Tamanho", "Acabamento"];

/**
 * Escolha da "variação" da opção (Cor, Alça, Tamanho…): mostra as variações cadastradas em
 * Variações das peças (mais as já usadas nesta peça) numa lista para escolher, em vez de um
 * campo de digitar com sugestões escondidas. "Outra variação…" permite digitar uma nova.
 * O valor final vai no campo `variantGroup`, o mesmo que o servidor já lê.
 */
export function VariationTypeField({
  id,
  options,
  defaultValue,
}: {
  id: string;
  /** Variações cadastradas e já usadas na peça (sem repetir, na ordem em que devem aparecer). */
  options: string[];
  defaultValue: string;
}) {
  const choices = [...new Set([...options, ...BASE_OPTIONS, ...(defaultValue ? [defaultValue] : [])])];

  const [selected, setSelected] = useState(defaultValue === "" ? "" : defaultValue);
  const [custom, setCustom] = useState("");

  const value = selected === OTHER ? custom.trim() : selected;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Variação</Label>
      <NativeSelect id={id} value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Nenhuma</option>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
        <option value={OTHER}>Outra variação…</option>
      </NativeSelect>

      {selected === OTHER ? (
        <Input
          aria-label="Nome da nova variação"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          maxLength={30}
          placeholder="Ex.: Forro"
          autoFocus
        />
      ) : null}

      <input type="hidden" name="variantGroup" value={value} />
    </div>
  );
}
