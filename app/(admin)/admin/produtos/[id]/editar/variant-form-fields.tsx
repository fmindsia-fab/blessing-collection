"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  findMaterialsForVariation,
  priceWithMaterial,
  type CatalogMaterial,
} from "@/lib/products/variation-materials";
import { padCents } from "@/lib/admin/pad-cents";
import { VariationTypeField } from "./variation-type-field";
import type { StoreColor } from "./variant-row";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Campos de uma variação da peça (nome, variação, cor e preço), iguais ao adicionar e ao
 * editar. Quando a variação escolhida tem materiais no cadastro com esse nome (ex.: "Alça"),
 * aparece uma lista deles: ao escolher um, o preço da variação vira
 * "preço da peça + preço do material" e o nome é preenchido com o do material. Os dois
 * campos continuam editáveis: é só um valor inicial.
 */
export function VariantFormFields({
  idPrefix,
  groupOptions,
  colors,
  materials,
  basePrice,
  defaults,
  showHints = false,
  groupMultiple = {},
}: {
  idPrefix: string;
  groupOptions: string[];
  colors: StoreColor[];
  materials: CatalogMaterial[];
  /** Preço base da peça, somado ao do material escolhido. */
  basePrice: number;
  defaults: {
    name: string;
    group: string;
    colorId: string;
    price: string;
    isRequired: boolean;
    allowMultiple: boolean;
    /** Material do estoque que a variação usa (ex.: a alça) e quanto; a baixa de estoque desconta isso. */
    materialId: string;
    materialQuantity: string;
  };
  showHints?: boolean;
  /** Por nome de grupo: o grupo já aceita mais de uma escolha (para o campo vir marcado ao escolher esse grupo). */
  groupMultiple?: Record<string, boolean>;
}) {
  const [name, setName] = useState(defaults.name);
  const [price, setPrice] = useState(defaults.price);
  const [group, setGroup] = useState(defaults.group);
  const [materialId, setMaterialId] = useState(defaults.materialId);
  const [materialQuantity, setMaterialQuantity] = useState(defaults.materialQuantity);
  const [allowMultiple, setAllowMultiple] = useState(defaults.allowMultiple);
  // Só troca nome/preço sozinho enquanto foram preenchidos pela lista (nunca por cima do que a pessoa digitou).
  const [nameFromMaterial, setNameFromMaterial] = useState(false);
  const [priceFromMaterial, setPriceFromMaterial] = useState(false);

  const matches = findMaterialsForVariation(group, materials);
  // O material já ligado à variação aparece mesmo que o nome dele não combine com o grupo.
  const linked = materials.find((material) => material.id === materialId);
  const choices = linked && !matches.some((material) => material.id === linked.id) ? [linked, ...matches] : matches;
  const selected = choices.find((material) => material.id === materialId);

  function chooseMaterial(id: string) {
    setMaterialId(id);
    const material = choices.find((candidate) => candidate.id === id);

    if (material) {
      setPrice(priceWithMaterial(basePrice, material.unit_cost).toFixed(2));
      setPriceFromMaterial(true);
      if (name.trim() === "" || nameFromMaterial) {
        setName(material.name);
        setNameFromMaterial(true);
      }
      return;
    }

    // "Nenhum": desfaz só o que a lista tinha preenchido.
    if (priceFromMaterial) setPrice("");
    if (nameFromMaterial) setName("");
    setPriceFromMaterial(false);
    setNameFromMaterial(false);
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-name`}>Nome</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameFromMaterial(false);
          }}
          placeholder="Ex.: Caramelo"
          maxLength={80}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <VariationTypeField
          id={`${idPrefix}-group`}
          options={groupOptions}
          defaultValue={defaults.group}
          onValueChange={(value) => {
            setGroup(value);
            // Trocar de grupo traz a regra daquele grupo (ex.: Alça já aceita duas escolhas).
            setAllowMultiple(groupMultiple[value] ?? false);
          }}
        />
        {showHints ? (
          <span className="text-sm text-muted-foreground">
            A cliente escolhe uma opção de cada variação.{" "}
            <Link href="/admin/grupos-variacao" className="underline underline-offset-2">
              Gerenciar variações
            </Link>
          </span>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:col-span-2">
        <input
          type="checkbox"
          name="isRequired"
          defaultChecked={defaults.isRequired}
          className="mt-1 size-5 shrink-0 accent-[var(--gold)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Escolha obrigatória</span>
          <span className="text-sm text-muted-foreground">
            Marque quando a cliente <strong className="text-foreground">precisa escolher uma</strong> das opções
            obrigatórias desta variação para comprar a peça (ex.: o tipo de alça da bolsa). Deixe desmarcado para
            um <strong className="text-foreground">complemento</strong>, que ela escolhe só se quiser (ex.: um tiracolo
            extra).
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:col-span-2">
        <input
          type="checkbox"
          name="allowMultiple"
          checked={allowMultiple}
          onChange={(event) => setAllowMultiple(event.target.checked)}
          className="mt-1 size-5 shrink-0 accent-[var(--gold)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Pode escolher mais de uma</span>
          <span className="text-sm text-muted-foreground">
            Marque quando a cliente pode levar <strong className="text-foreground">duas ou mais</strong> opções deste grupo
            (ex.: duas alças). Vale para todas as opções do grupo{group ? ` "${group}"` : ""}. Deixe desmarcado
            quando só faz sentido uma (ex.: cor).
          </span>
        </span>
      </label>

      {choices.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--brand-soft)]/60 p-3 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-material`}>Material do estoque (opcional)</Label>
          <NativeSelect
            id={`${idPrefix}-material`}
            name="materialId"
            value={materialId}
            onChange={(e) => chooseMaterial(e.target.value)}
          >
            <option value="">Nenhum (não desconta do estoque)</option>
            {choices.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} ({formatBRL(material.unit_cost)}
                {material.unit && material.unit !== "un" ? ` por ${material.unit}` : ""})
              </option>
            ))}
          </NativeSelect>

          {selected ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${idPrefix}-material-qty`}>
                Quanto desse material cada peça usa ({selected.unit})
              </Label>
              <Input
                id={`${idPrefix}-material-qty`}
                name="materialQuantity"
                inputMode="decimal"
                value={materialQuantity}
                onChange={(e) => setMaterialQuantity(e.target.value.replace(",", "."))}
                className="max-w-40"
              />
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {selected ? (
              <>
                O preço soma: peça {formatBRL(basePrice)} + {selected.name} {formatBRL(selected.unit_cost)} ={" "}
                <strong className="text-foreground">{formatBRL(priceWithMaterial(basePrice, selected.unit_cost))}</strong>
                . Quando um pedido com esta variação entra em produção, o estoque desconta este material.
              </>
            ) : (
              <>
                Escolha o material (ex.: a alça) para somar o preço dele e descontar do estoque quando esta variação for
                escolhida num pedido.
              </>
            )}
          </p>
        </div>
      ) : (
        <>
          <input type="hidden" name="materialId" value={materialId} />
          <input type="hidden" name="materialQuantity" value={materialQuantity} />
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-color`}>Cor (opcional)</Label>
        <NativeSelect id={`${idPrefix}-color`} name="colorId" defaultValue={defaults.colorId}>
          <option value="">Sem cor</option>
          {colors.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </NativeSelect>
        {showHints && colors.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Nenhuma cor cadastrada —{" "}
            <Link href="/admin/cores" className="underline underline-offset-2">
              cadastrar cores
            </Link>
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-price`}>Preço total (opcional)</Label>
        <Input
          id={`${idPrefix}-price`}
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setPriceFromMaterial(false);
          }}
          onBlur={(e) => padCents(e.target)}
          placeholder="Preço base"
        />
        {/* O catálogo deriva o adicional da diferença para o preço base, então aqui vai o valor cheio. */}
        <span className="text-sm text-muted-foreground">Valor cheio da peça com esta variação, não o acréscimo.</span>
      </div>
    </>
  );
}
