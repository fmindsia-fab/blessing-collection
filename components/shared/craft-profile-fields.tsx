"use client";

import { useEffect, useId, useState } from "react";
import { BR_STATES, CRAFT_TYPES } from "@/lib/store/craft-profile";
import { listCitiesByState } from "@/lib/geo/cities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Cache por UF durante a sessão do navegador: trocar de estado e voltar não
// refaz a consulta.
const citiesCache = new Map<string, string[]>();

// Campos nativos (name=state|city|craftTypes|craftOther): funcionam dentro de
// qualquer <form action={serverAction}> — cadastro e configurações.
export function CraftProfileFields({
  defaultCity = "",
  defaultState = "",
  defaultCraftTypes = [],
  defaultCraftOther = "",
  required = false,
}: {
  defaultCity?: string;
  defaultState?: string;
  defaultCraftTypes?: string[];
  defaultCraftOther?: string;
  required?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(defaultCraftTypes);
  const [state, setState] = useState(defaultState);
  const [city, setCity] = useState(defaultCity);
  const [citiesByState, setCitiesByState] = useState<Record<string, string[]>>(() =>
    defaultState && citiesCache.has(defaultState) ? { [defaultState]: citiesCache.get(defaultState)! } : {},
  );
  const listId = useId();

  const cities = state ? (citiesByState[state] ?? citiesCache.get(state) ?? []) : [];
  // Sem entrada em citiesByState = busca ainda não respondeu (lista vazia
  // por falha também é gravada, então o placeholder não fica preso).
  const loadingCities = Boolean(state) && citiesByState[state] === undefined && !citiesCache.has(state);

  // Carrega os municípios da UF escolhida (com cache da sessão). O setState
  // só acontece nos callbacks da busca, nunca de forma síncrona no efeito.
  useEffect(() => {
    if (!state || citiesCache.has(state)) return;

    let cancelled = false;
    listCitiesByState(state)
      .then((list) => {
        if (list.length > 0) citiesCache.set(state, list);
        if (!cancelled) setCitiesByState((prev) => ({ ...prev, [state]: list }));
      })
      .catch(() => {
        if (!cancelled) setCitiesByState((prev) => ({ ...prev, [state]: [] }));
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  // Cidade de outro estado não faz sentido: limpa ao trocar a UF.
  function handleStateChange(next: string) {
    if (next !== state) setCity("");
    setState(next);
  }

  function toggle(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <>
      <div className="grid grid-cols-[6.5rem_1fr] gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">UF</Label>
          <select
            id="state"
            name="state"
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            required={required}
            autoComplete="address-level1"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">UF</option>
            {BR_STATES.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            list={cities.length > 0 ? listId : undefined}
            maxLength={80}
            autoComplete="off"
            disabled={!state}
            required={required}
            placeholder={
              !state ? "Escolha o estado primeiro" : loadingCities ? "Carregando cidades..." : "Digite para buscar"
            }
          />
          {cities.length > 0 ? (
            <datalist id={listId}>
              {cities.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          ) : null}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Tipo de artesanato</legend>
        <span className="text-xs text-muted-foreground">Marque tudo o que o seu ateliê produz.</span>
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CRAFT_TYPES.map((craft) => {
            const checked = selected.includes(craft.value);
            return (
              <label
                key={craft.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors has-[:checked]:border-foreground/50 has-[:checked]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--gold)]"
              >
                <input
                  type="checkbox"
                  name="craftTypes"
                  value={craft.value}
                  checked={checked}
                  onChange={() => toggle(craft.value)}
                  className="size-4 accent-[var(--gold)]"
                />
                {craft.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {selected.includes("other") ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="craftOther">Qual outro tipo de artesanato?</Label>
          <Input
            id="craftOther"
            name="craftOther"
            defaultValue={defaultCraftOther}
            maxLength={60}
            placeholder="Ex: Amigurumi, arranjos de flores..."
            required
          />
        </div>
      ) : null}
    </>
  );
}
