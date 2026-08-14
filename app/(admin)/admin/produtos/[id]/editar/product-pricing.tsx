"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { TrashIcon } from "lucide-react";
import {
  addProductMaterial,
  applySuggestedPrice,
  removeProductMaterial,
  updateProductPricing,
  type PricingFormState,
} from "@/lib/pricing/actions";
import {
  calculateCost,
  calculateInstallmentOptions,
  calculateMaterialCost,
  calculatePrice,
  marginToMarkup,
  markupToMargin,
  suggestRoundedPrices,
  type LaborRates,
  type PaymentMethod,
} from "@/lib/pricing/calculate";
import {
  basisPointsToPercent,
  formatBRL,
  percentToBasisPoints,
  toCents,
  toReais,
} from "@/lib/pricing/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PricingMethodValue } from "@/types/database.types";

type Material = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
};

type Props = {
  productId: string;
  currentPrice: number;
  productionHours: number;
  otherCosts: number;
  pricingMethod: PricingMethodValue | null;
  pricingRatePercent: number | null;
  materials: Material[];
  rates: LaborRates;
  paymentMethods: PaymentMethod[];
  taxBasisPoints: number;
  storeDefaultMethod: PricingMethodValue;
  storeDefaultRate: number;
  /** Sem valor/hora configurado, a mão de obra sai de graça da conta. */
  hasLaborConfigured: boolean;
};

const initialState: PricingFormState = {};

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        strong && "border-t border-border pt-3 text-base font-medium",
      )}
    >
      <span className={cn("text-sm", muted && "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular-nums", !strong && "text-sm", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

export function ProductPricing({
  productId,
  currentPrice,
  productionHours,
  otherCosts,
  pricingMethod,
  pricingRatePercent,
  materials,
  rates,
  paymentMethods,
  taxBasisPoints,
  storeDefaultMethod,
  storeDefaultRate,
  hasLaborConfigured,
}: Props) {
  const [materialState, addMaterialAction, isAddingMaterial] = useActionState(
    addProductMaterial.bind(null, productId),
    initialState,
  );
  const [saveState, saveAction, isSaving] = useActionState(
    updateProductPricing.bind(null, productId),
    initialState,
  );
  const [isPending, startTransition] = useTransition();

  // Prévia ao vivo enquanto digita — salvar é só para persistir.
  const [hours, setHours] = useState(String(productionHours || ""));
  const [others, setOthers] = useState(String(otherCosts || ""));
  const [method, setMethod] = useState<PricingMethodValue | "inherit">(pricingMethod ?? "inherit");
  const [rate, setRate] = useState(String(pricingRatePercent ?? ""));

  const effectiveMethod = method === "inherit" ? storeDefaultMethod : method;
  const effectiveRate = method === "inherit" ? storeDefaultRate : Number(rate) || 0;

  const cost = useMemo(
    () =>
      calculateCost({
        materials: materials.map((m) => ({
          description: m.description,
          quantity: m.quantity,
          unitCostCents: toCents(m.unit_cost),
        })),
        productionHours: Number(hours) || 0,
        rates,
        otherCostsCents: toCents(Number(others) || 0),
      }),
    [materials, hours, others, rates],
  );

  const priceResult = calculatePrice({
    totalCostCents: cost.totalCents,
    method: effectiveMethod,
    rateBasisPoints: percentToBasisPoints(effectiveRate),
    feeBasisPoints: taxBasisPoints,
  });

  const suggestedCents = priceResult.ok ? priceResult.priceCents : 0;

  // Preço escolhido pela proprietária ao arredondar. Enquanto for null, vale a
  // sugestão calculada — e ele é descartado quando os custos mudam, senão a
  // tabela mostraria margens de um preço que não corresponde mais à conta.
  const [roundedCents, setRoundedCents] = useState<number | null>(null);
  const [roundedFor, setRoundedFor] = useState(suggestedCents);

  if (roundedFor !== suggestedCents) {
    setRoundedFor(suggestedCents);
    setRoundedCents(null);
  }

  const finalCents = roundedCents ?? suggestedCents;
  const roundingOptions = priceResult.ok ? suggestRoundedPrices(suggestedCents) : [];

  // O preço à vista é a base; cada modalidade recebe a taxa por cima, de modo
  // que o líquido seja sempre o mesmo.
  const installmentOptions = priceResult.ok
    ? calculateInstallmentOptions({ cashPriceCents: finalCents, methods: paymentMethods })
    : [];

  // Mostra o indicador equivalente para não confundir os dois conceitos.
  const rateBp = percentToBasisPoints(effectiveRate);
  const equivalent =
    effectiveMethod === "margin"
      ? marginToMarkup(rateBp)
      : markupToMargin(rateBp);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Formação de preço</h2>
        <p className="text-xs text-muted-foreground">
          Uso interno — nada disto aparece no catálogo.
        </p>
      </div>

      {!hasLaborConfigured ? (
        <p className="rounded-[var(--radius)] border border-dashed border-[var(--gold)] px-4 py-3 text-xs">
          Sua hora de trabalho ainda não foi configurada, então a mão de obra está saindo de graça
          da conta.{" "}
          <a href="/admin/precificacao" className="underline underline-offset-2">
            Configurar agora
          </a>
        </p>
      ) : null}

      {/* MATERIAIS */}
      <section className="flex flex-col gap-3">
        <span className="kicker">Materiais</span>

        {materials.length > 0 ? (
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {materials.map((material) => (
              <div key={material.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{material.description}</span>
                  <span className="text-xs text-muted-foreground">
                    {material.quantity} {material.unit} ×{" "}
                    {formatBRL(toCents(material.unit_cost))}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm tabular-nums">
                    {formatBRL(
                      calculateMaterialCost({
                        description: material.description,
                        quantity: material.quantity,
                        unitCostCents: toCents(material.unit_cost),
                      }),
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(() => removeProductMaterial(productId, material.id))
                    }
                    aria-label={`Remover ${material.description}`}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-destructive focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius)] border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
            Fio, alça, fecho, etiqueta, tag, forro… adicione cada item abaixo.
          </p>
        )}

        <form action={addMaterialAction} className="grid gap-2 sm:grid-cols-[1fr_5rem_4rem_6rem_auto]">
          <Input name="description" required maxLength={80} placeholder="Fio" aria-label="Material" />
          <Input
            name="quantity"
            type="number"
            step="0.001"
            min="0"
            defaultValue="1"
            aria-label="Quantidade"
          />
          <Input name="unit" maxLength={10} defaultValue="un" aria-label="Unidade" />
          <Input
            name="unitCost"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            aria-label="Custo unitário"
          />
          <Button type="submit" variant="outline" size="sm" disabled={isAddingMaterial}>
            {isAddingMaterial ? "..." : "Somar"}
          </Button>
          {materialState.error ? (
            <p className="text-sm text-destructive sm:col-span-5">{materialState.error}</p>
          ) : null}
        </form>
      </section>

      {/* TEMPO E MARGEM */}
      <form action={saveAction} className="flex flex-col gap-4 border-t border-border pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="productionHours">Horas de produção</Label>
            <Input
              id="productionHours"
              name="productionHours"
              type="number"
              step="0.25"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="4"
            />
            <span className="text-xs text-muted-foreground">
              {rates.totalPerHourCents > 0
                ? `${formatBRL(rates.totalPerHourCents)} por hora`
                : "Configure sua hora em Precificação"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="otherCosts">Outros custos (R$)</Label>
            <Input
              id="otherCosts"
              name="otherCosts"
              type="number"
              step="0.01"
              min="0"
              value={others}
              onChange={(e) => setOthers(e.target.value)}
              placeholder="0,00"
            />
            <span className="text-xs text-muted-foreground">Embalagem, frete de insumo…</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pricingMethod">Método</Label>
            <select
              id="pricingMethod"
              name="method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PricingMethodValue | "inherit")}
              className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
            >
              <option value="inherit">
                Padrão da loja ({storeDefaultMethod === "margin" ? "margem" : "markup"}{" "}
                {storeDefaultRate}%)
              </option>
              <option value="margin">Margem sobre o preço</option>
              <option value="markup">Markup sobre o custo</option>
            </select>
          </div>

          {method !== "inherit" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ratePercent">
                {method === "margin" ? "Margem (%)" : "Markup (%)"}
              </Label>
              <Input
                id="ratePercent"
                name="ratePercent"
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={method === "margin" ? "50" : "100"}
              />
            </div>
          ) : (
            <input type="hidden" name="ratePercent" value="" />
          )}
        </div>

        {saveState.error ? <p className="text-sm text-destructive">{saveState.error}</p> : null}
        {saveState.success ? <p className="text-sm text-green-700">Custos salvos.</p> : null}

        <Button type="submit" variant="outline" size="sm" disabled={isSaving} className="w-fit">
          {isSaving ? "Salvando..." : "Salvar custos"}
        </Button>
      </form>

      {/* RESULTADO */}
      <section className="flex flex-col gap-4 rounded-[var(--radius-image)] bg-secondary/50 p-5">
        <span className="kicker">Resultado</span>

        <div className="flex flex-col">
          <Row label="Materiais" value={formatBRL(cost.materialsCents)} />
          <Row label="Mão de obra" value={formatBRL(cost.laborCents)} />
          <Row label="Custo fixo rateado" value={formatBRL(cost.fixedCostShareCents)} />
          {cost.otherCostsCents > 0 ? (
            <Row label="Outros custos" value={formatBRL(cost.otherCostsCents)} />
          ) : null}
          <Row label="Custo total" value={formatBRL(cost.totalCents)} strong />
        </div>

        {priceResult.ok ? (
          <>
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm">
                  {roundedCents ? "Preço arredondado" : "Sugestão de venda"}
                </span>
                <span className="flex items-baseline gap-2">
                  {roundedCents ? (
                    <span className="text-sm tabular-nums text-muted-foreground line-through">
                      {formatBRL(suggestedCents)}
                    </span>
                  ) : null}
                  <span className="font-[family-name:var(--font-brand)] text-2xl tabular-nums">
                    {formatBRL(finalCents)}
                  </span>
                </span>
              </div>

              {/* Markup e margem não são a mesma coisa: mostrar o equivalente
                  evita a leitura errada do percentual. */}
              <p className="text-xs text-muted-foreground">
                {effectiveMethod === "margin"
                  ? `Margem de ${effectiveRate}% sobre o preço${
                      equivalent !== null
                        ? ` — equivale a ${basisPointsToPercent(equivalent).toFixed(0)}% de markup sobre o custo`
                        : ""
                    }`
                  : `Markup de ${effectiveRate}% sobre o custo — equivale a ${basisPointsToPercent(
                      equivalent ?? 0,
                    ).toFixed(0)}% de margem sobre o preço`}
              </p>

              {/* Só valores acima da sugestão: arredondar para baixo devolveria
                  um preço abaixo do que a margem pediu. */}
              {roundingOptions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Arredondar para</span>
                  {roundingOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRoundedCents(option)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
                        finalCents === option
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground hover:bg-secondary",
                      )}
                    >
                      {formatBRL(option)}
                    </button>
                  ))}
                  {roundedCents ? (
                    <button
                      type="button"
                      onClick={() => setRoundedCents(null)}
                      className="text-xs text-muted-foreground underline underline-offset-2 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
                    >
                      Voltar ao calculado
                    </button>
                  ) : null}
                </div>
              ) : null}

              {currentPrice > 0 && Math.abs(toCents(currentPrice) - finalCents) > 50 ? (
                <p className="text-xs text-muted-foreground">
                  Preço atual da peça: {formatBRL(toCents(currentPrice))}
                </p>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => applySuggestedPrice(productId, toReais(finalCents)))
                }
                className="mt-1 w-fit"
              >
                Usar como preço da peça
              </Button>
            </div>

            {installmentOptions.length > 0 ? (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <span className="kicker">Preço por forma de pagamento</span>
                <p className="text-xs text-muted-foreground">
                  A taxa do cartão é repassada ao cliente, então o que você recebe é o mesmo em
                  todas as modalidades.
                </p>
                <div className="-mx-1 overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-1 py-2 font-normal">Forma</th>
                        <th className="px-1 py-2 text-right font-normal">Cliente paga</th>
                        <th className="px-1 py-2 text-right font-normal">Parcela</th>
                        <th className="px-1 py-2 text-right font-normal">Você recebe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {installmentOptions.map((line) => (
                        <tr key={line.method.id}>
                          <td className="px-1 py-2">{line.method.label}</td>
                          <td className="px-1 py-2 text-right tabular-nums">
                            {formatBRL(line.priceCents)}
                            {line.surchargeCents > 0 ? (
                              <span className="ml-1 text-xs text-muted-foreground">
                                +{formatBRL(line.surchargeCents)}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-1 py-2 text-right tabular-nums text-muted-foreground">
                            {line.method.installments > 1
                              ? `${line.method.installments}× ${formatBRL(line.installmentCents)}`
                              : "—"}
                          </td>
                          <td className="px-1 py-2 text-right tabular-nums">
                            {formatBRL(line.netReceivedCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Lucro em qualquer forma:{" "}
                  <strong className="text-foreground">
                    {formatBRL(finalCents - cost.totalCents)}
                  </strong>
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-destructive">
            {priceResult.error}
          </p>
        )}
      </section>
    </div>
  );
}
