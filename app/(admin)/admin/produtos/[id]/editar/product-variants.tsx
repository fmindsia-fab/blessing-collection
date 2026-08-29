"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createVariant, createSizeVariants, type VariantFormState } from "@/lib/products/variant-actions";
import { SIZE_PRESETS } from "@/lib/products/size-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VariantRow, type StoreColor, type Variant } from "./variant-row";
import type { BusinessType } from "@/types/database.types";

type ProductVariantsProps = {
  productId: string;
  variants: Variant[];
  colors: StoreColor[];
  /** Grupos cadastrados em Grupos de variação (/admin/grupos-variacao). */
  catalogGroups: string[];
  businessType: BusinessType;
};

const initialState: VariantFormState = {};

/** Cor + preço são comuns aos dois forms de criação (tamanhos e texto livre). */
function ColorField({ colors }: { colors: StoreColor[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="variant-color">Cor (opcional)</Label>
      <select
        id="variant-color"
        name="colorId"
        defaultValue=""
        className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
      >
        <option value="">Sem cor</option>
        {colors.map((color) => (
          <option key={color.id} value={color.id}>
            {color.name}
          </option>
        ))}
      </select>
      {colors.length === 0 ? (
        <span className="text-xs text-muted-foreground">
          Nenhuma cor cadastrada —{" "}
          <Link href="/admin/cores" className="underline underline-offset-2">
            cadastrar cores
          </Link>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Form de criação por multi-select de tamanho: marca 1, 2 ou mais chips e
 * cria uma variante por tamanho selecionado de uma vez (createSizeVariants),
 * em vez de repetir "Adicionar variação" um tamanho por vez. Só aparece
 * quando a loja tem preset (business_type clothing/footwear) — artesanato
 * mantém o form de texto livre abaixo.
 */
function SizeVariantsForm({
  productId,
  colors,
  preset,
}: {
  productId: string;
  colors: StoreColor[];
  preset: { group: string; values: string[] };
}) {
  const action = createSizeVariants.bind(null, productId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }

  return (
    <form
      action={(formData) => {
        formAction(formData);
        setSelected([]);
      }}
      className="grid grid-cols-2 gap-3"
    >
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label>{preset.group}</Label>
        <div className="flex flex-wrap gap-1.5">
          {preset.values.map((value) => {
            const isSelected = selected.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? "border-[var(--gold)] bg-[var(--gold)]/[0.12] text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
        {selected.map((value) => (
          <input key={value} type="hidden" name="sizes" value={value} />
        ))}
        <input type="hidden" name="group" value={preset.group} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="size-variant-price">Preço específico (opcional)</Label>
        <Input id="size-variant-price" name="price" type="number" step="0.01" min="0" />
        <span className="text-xs text-muted-foreground">Aplica o mesmo preço a todos os tamanhos marcados.</span>
      </div>

      <ColorField colors={colors} />

      {state.error ? <p className="col-span-2 text-sm text-destructive">{state.error}</p> : null}
      <Button
        type="submit"
        variant="outline"
        disabled={isPending || selected.length === 0}
        className="col-span-2 w-fit"
      >
        {isPending
          ? "Adicionando..."
          : selected.length > 0
            ? `Adicionar ${selected.length} ${selected.length === 1 ? "tamanho" : "tamanhos"}`
            : "Marque os tamanhos"}
      </Button>
    </form>
  );
}

/** Form de texto livre — usado quando a loja não tem preset (artesanato) ou para variações fora do eixo de tamanho. */
function FreeTextVariantForm({
  productId,
  colors,
  existingGroups,
}: {
  productId: string;
  colors: StoreColor[];
  existingGroups: string[];
}) {
  const createAction = createVariant.bind(null, productId);
  const [state, formAction, isPending] = useActionState(createAction, initialState);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="variant-name">Nome</Label>
        <Input id="variant-name" name="name" placeholder="Cor: Caramelo" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="variant-price">Preço específico (opcional)</Label>
        <Input id="variant-price" name="price" type="number" step="0.01" min="0" />
      </div>

      <ColorField colors={colors} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="variant-group">Grupo</Label>
        <Input
          id="variant-group"
          name="variantGroup"
          list="variant-groups"
          maxLength={30}
          placeholder="Cor"
          defaultValue="Cor"
        />
        {/* Sugere os grupos do catálogo (/admin/grupos-variacao) + os já
            usados nesta peça, para não surgir "Cor" e "cores" como eixos
            separados por diferença de digitação. Os 4 fixos abaixo cobrem o
            catálogo vazio; o navegador ignora repetição no datalist. */}
        <datalist id="variant-groups">
          {existingGroups.map((group) => (
            <option key={group} value={group} />
          ))}
          <option value="Cor" />
          <option value="Alça" />
          <option value="Tamanho" />
          <option value="Acabamento" />
        </datalist>
        <span className="text-xs text-muted-foreground">
          A cliente escolhe uma opção de cada grupo.{" "}
          <Link href="/admin/grupos-variacao" className="underline underline-offset-2">
            Gerenciar grupos
          </Link>
        </span>
      </div>
      <input type="hidden" name="status" value="available" />
      {state.error ? <p className="col-span-2 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" variant="outline" disabled={isPending} className="col-span-2 w-fit">
        {isPending ? "Adicionando..." : "Adicionar variação"}
      </Button>
    </form>
  );
}

export function ProductVariants({
  productId,
  variants,
  colors,
  catalogGroups,
  businessType,
}: ProductVariantsProps) {
  const preset = SIZE_PRESETS[businessType];

  // Grupos já usados nesta peça + os cadastrados no catálogo da loja, sem
  // repetir. O catálogo é a fonte principal (pedido do usuário: gerenciar os
  // grupos numa tela própria); os já usados na peça cobrem um grupo digitado
  // antes de existir uma tela de catálogo, ou já arquivado nela.
  const existingGroups = [
    ...new Set([
      ...catalogGroups,
      ...variants.map((v) => v.variant_group).filter((g): g is string => Boolean(g)),
    ]),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Variações</h2>
        <p className="text-xs text-zinc-500">Cores, tamanhos ou outras variações. Preço opcional substitui o preço base.</p>
      </div>

      {variants.length > 0 ? (
        <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              productId={productId}
              variant={variant}
              colors={colors}
              groups={existingGroups}
              businessType={businessType}
            />
          ))}
        </div>
      ) : null}

      {preset ? (
        <SizeVariantsForm productId={productId} colors={colors} preset={preset} />
      ) : (
        <FreeTextVariantForm productId={productId} colors={colors} existingGroups={existingGroups} />
      )}
    </div>
  );
}
