"use client";

import { YEARS_ACTIVE } from "@/lib/store/craft-profile";
import { Label } from "@/components/ui/label";

type TriValue = "yes" | "no" | "";

function YesNoField({
  name,
  legend,
  defaultValue,
}: {
  name: string;
  legend: string;
  defaultValue: TriValue;
}) {
  const options: { value: TriValue; label: string }[] = [
    { value: "yes", label: "Sim" },
    { value: "no", label: "Não" },
    { value: "", label: "Prefiro não informar" },
  ];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value || "none"}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors has-[:checked]:border-foreground/50 has-[:checked]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--gold)]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              className="size-4 accent-[var(--gold)]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// Campos nativos (name=acceptsCustomOrders|shipsNationwide|yearsActive|
// marketplaceOptIn) para qualquer <form action={serverAction}>.
export function MarketplaceProfileFields({
  acceptsCustomOrders = null,
  shipsNationwide = null,
  yearsActive = "",
  marketplaceOptIn = false,
}: {
  acceptsCustomOrders?: boolean | null;
  shipsNationwide?: boolean | null;
  yearsActive?: string | null;
  marketplaceOptIn?: boolean;
}) {
  const toTri = (v: boolean | null): TriValue => (v === null ? "" : v ? "yes" : "no");

  return (
    <>
      <YesNoField
        name="acceptsCustomOrders"
        legend="Faz encomenda sob medida?"
        defaultValue={toTri(acceptsCustomOrders)}
      />
      <YesNoField
        name="shipsNationwide"
        legend="Envia para todo o Brasil?"
        defaultValue={toTri(shipsNationwide)}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="yearsActive">Há quanto tempo o ateliê atua?</Label>
        <select
          id="yearsActive"
          name="yearsActive"
          defaultValue={yearsActive ?? ""}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">Prefiro não informar</option>
          {YEARS_ACTIVE.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--gold)]">
        <input
          type="checkbox"
          name="marketplaceOptIn"
          defaultChecked={marketplaceOptIn}
          className="mt-0.5 size-4 accent-[var(--gold)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">Quero divulgar meu ateliê no marketplace do AteliFácil</span>
          <span className="text-xs text-muted-foreground">
            Autorizo exibir nome, cidade, tipo de artesanato e link do catálogo. Você pode mudar de ideia
            a qualquer momento nas Configurações.
          </span>
        </span>
      </label>
    </>
  );
}
