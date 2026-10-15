"use client";

import { useState } from "react";
import { BR_STATES, CRAFT_TYPES } from "@/lib/store/craft-profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Campos nativos (name=city|state|craftTypes|craftOther): funcionam dentro de
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

  function toggle(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <>
      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            defaultValue={defaultCity}
            maxLength={80}
            autoComplete="address-level2"
            required={required}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">UF</Label>
          <select
            id="state"
            name="state"
            defaultValue={defaultState}
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
