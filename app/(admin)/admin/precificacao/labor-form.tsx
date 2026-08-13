"use client";

import { useActionState, useState } from "react";
import { updatePricingSettings, type PricingFormState } from "@/lib/pricing/actions";
import { calculateLaborRates } from "@/lib/pricing/calculate";
import { formatBRL, toCents } from "@/lib/pricing/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PricingMethodValue, TaxRegime } from "@/types/database.types";

const initialState: PricingFormState = {};

type Settings = {
  monthly_pay: number;
  monthly_fixed_cost: number;
  productive_hours_per_month: number;
  tax_regime: TaxRegime;
  tax_percent: number;
  default_pricing_method: PricingMethodValue;
  default_margin_percent: number;
};

const REGIME_HINT: Record<TaxRegime, string> = {
  none: "Nenhum percentual será somado ao preço.",
  mei: "O DAS é valor fixo mensal — some-o ao custo fixo acima. Nada é cobrado por venda.",
  simples: "A alíquota entra como percentual sobre cada venda.",
  other: "A alíquota entra como percentual sobre cada venda.",
};

export function LaborForm({ settings }: { settings: Settings }) {
  const [state, formAction, isPending] = useActionState(updatePricingSettings, initialState);

  // Prévia ao vivo: a proprietária vê o valor/hora mudar enquanto digita, em
  // vez de precisar salvar para descobrir o resultado.
  const [pay, setPay] = useState(String(settings.monthly_pay || ""));
  const [fixed, setFixed] = useState(String(settings.monthly_fixed_cost || ""));
  const [hours, setHours] = useState(String(settings.productive_hours_per_month || ""));
  const [regime, setRegime] = useState<TaxRegime>(settings.tax_regime);
  const [method, setMethod] = useState<PricingMethodValue>(settings.default_pricing_method);

  const rates = calculateLaborRates({
    monthlyPayCents: toCents(Number(pay) || 0),
    monthlyFixedCostCents: toCents(Number(fixed) || 0),
    productiveHoursPerMonth: Number(hours) || 0,
  });

  const incidesOnSale = regime === "simples" || regime === "other";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4">
        <legend className="kicker mb-3">Sua hora de trabalho</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monthlyPay">Quanto quer ganhar por mês (R$)</Label>
            <Input
              id="monthlyPay"
              name="monthlyPay"
              type="number"
              step="0.01"
              min="0"
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              placeholder="2500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monthlyFixedCost">Custos fixos do mês (R$)</Label>
            <Input
              id="monthlyFixedCost"
              name="monthlyFixedCost"
              type="number"
              step="0.01"
              min="0"
              value={fixed}
              onChange={(e) => setFixed(e.target.value)}
              placeholder="800"
            />
            <span className="text-xs text-muted-foreground">
              Aluguel, energia, internet, DAS do MEI, assinaturas.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="productiveHours">Horas produtivas no mês</Label>
            <Input
              id="productiveHours"
              name="productiveHours"
              type="number"
              step="0.5"
              min="0"
              max="744"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="100"
            />
            <span className="text-xs text-muted-foreground">
              Só o tempo com a peça na mão — não conte atendimento, fotos e correio.
            </span>
          </div>
        </div>

        {rates.totalPerHourCents > 0 ? (
          <dl className="flex flex-wrap gap-x-8 gap-y-2 rounded-[var(--radius)] bg-secondary/60 px-5 py-4 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Mão de obra/hora</dt>
              <dd className="tabular-nums">{formatBRL(rates.laborPerHourCents)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Custo fixo/hora</dt>
              <dd className="tabular-nums">{formatBRL(rates.fixedCostPerHourCents)}</dd>
            </div>
            <div className="flex gap-2 font-medium">
              <dt>Hora produtiva</dt>
              <dd className="tabular-nums">{formatBRL(rates.totalPerHourCents)}</dd>
            </div>
          </dl>
        ) : (
          <p className="rounded-[var(--radius)] border border-dashed border-border px-5 py-4 text-xs text-muted-foreground">
            Preencha os três campos para ver quanto vale a sua hora.
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-6">
        <legend className="kicker mb-3">Tributação</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="taxRegime">Regime</Label>
            <select
              id="taxRegime"
              name="taxRegime"
              value={regime}
              onChange={(e) => setRegime(e.target.value as TaxRegime)}
              className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
            >
              <option value="none">Nenhum</option>
              <option value="mei">MEI</option>
              <option value="simples">Simples Nacional</option>
              <option value="other">Outro</option>
            </select>
            <span className="text-xs text-muted-foreground">{REGIME_HINT[regime]}</span>
          </div>

          {incidesOnSale ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxPercent">Alíquota sobre a venda (%)</Label>
              <Input
                id="taxPercent"
                name="taxPercent"
                type="number"
                step="0.01"
                min="0"
                max="99.99"
                defaultValue={settings.tax_percent || ""}
                placeholder="6"
              />
            </div>
          ) : (
            <input type="hidden" name="taxPercent" value="0" />
          )}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-6">
        <legend className="kicker mb-3">Método padrão</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultMethod">Como calcular o preço</Label>
            <select
              id="defaultMethod"
              name="defaultMethod"
              value={method}
              onChange={(e) => setMethod(e.target.value as PricingMethodValue)}
              className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
            >
              <option value="margin">Margem sobre o preço de venda</option>
              <option value="markup">Markup sobre o custo</option>
            </select>
            <span className="text-xs text-muted-foreground">
              {method === "margin"
                ? "O percentual é o que sobra de fato, já descontadas as taxas."
                : "Multiplica o custo. O percentual não é o lucro final — as taxas saem dele."}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultRate">
              {method === "margin" ? "Margem desejada (%)" : "Markup (%)"}
            </Label>
            <Input
              id="defaultRate"
              name="defaultRate"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.default_margin_percent || ""}
              placeholder={method === "margin" ? "50" : "100"}
            />
          </div>
        </div>
      </fieldset>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">Configurações salvas.</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
