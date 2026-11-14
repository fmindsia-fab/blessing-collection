"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertTriangleIcon } from "lucide-react";
import {
  createPaymentMethod,
  togglePaymentMethod,
  updatePaymentMethodFees,
  type PricingFormState,
} from "@/lib/pricing/actions";
import { calculateInstallmentOptions, parseCurrencyInput } from "@/lib/pricing/calculate";
import { isMissingFee, sumFeePercent } from "@/lib/pricing/fees";
import { formatBRL, percentToBasisPoints } from "@/lib/pricing/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/admin/status-pill";
import type { ArchivableStatus } from "@/types/database.types";

type Method = {
  id: string;
  label: string;
  fee_percent: number;
  admin_fee_percent: number;
  installment_fee_percent: number;
  installments: number;
  status: ArchivableStatus;
};

const initialState: PricingFormState = {};

// Valor inicial da conferência; a proprietária troca pelo preço da bolsa que quiser.
const DEFAULT_PREVIEW_VALUE = "100";

const toNumber = (value: string) => Number(value.replace(",", ".")) || 0;
const formatPercent = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PaymentMethods({ methods }: { methods: Method[] }) {
  const [state, formAction, isPending] = useActionState(createPaymentMethod, initialState);
  const [isSaving, startTransition] = useTransition();
  // O que está digitado em cada linha: o total e a conferência acompanham na hora,
  // antes mesmo de salvar.
  const [values, setValues] = useState<Record<string, { admin: string; installment: string }>>(() =>
    Object.fromEntries(
      methods.map((method) => [
        method.id,
        {
          admin: method.admin_fee_percent ? String(method.admin_fee_percent) : "",
          installment: method.installment_fee_percent ? String(method.installment_fee_percent) : "",
        },
      ]),
    ),
  );

  // Forma criada depois do primeiro desenho ainda não está em `values`: cai no que veio do servidor.
  const fieldsFor = (method: Method) =>
    values[method.id] ?? {
      admin: method.admin_fee_percent ? String(method.admin_fee_percent) : "",
      installment: method.installment_fee_percent ? String(method.installment_fee_percent) : "",
    };

  const [previewValue, setPreviewValue] = useState(DEFAULT_PREVIEW_VALUE);
  const previewCashCents = parseCurrencyInput(previewValue);

  const totalFor = (method: Method) => {
    const typed = fieldsFor(method);
    return sumFeePercent(
      toNumber(typed.admin),
      method.installments > 1 ? toNumber(typed.installment) : 0,
    );
  };

  const previewOptions = calculateInstallmentOptions({
    cashPriceCents: previewCashCents,
    methods: methods
      .filter((method) => method.status === "active")
      .map((method) => ({
        id: method.id,
        label: method.label,
        feeBasisPoints: percentToBasisPoints(totalFor(method)),
        installments: method.installments,
      })),
  });

  function save(method: Method) {
    const typed = fieldsFor(method);
    const admin = toNumber(typed.admin);
    const installment = method.installments > 1 ? toNumber(typed.installment) : 0;
    if (admin === method.admin_fee_percent && installment === method.installment_fee_percent) return;
    startTransition(() => updatePaymentMethodFees(method.id, admin, installment));
  }

  function setField(id: string, field: "admin" | "installment", value: string) {
    setValues((current) => ({
      ...current,
      [id]: { ...fieldsFor(methods.find((m) => m.id === id)!), ...current[id], [field]: value },
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Copie do aplicativo do seu banco ou da maquininha: <strong>taxa por venda</strong> e, nas
        parcelas, a <strong>taxa de parcelamento</strong>. O sistema soma as duas e repassa o total
        ao cliente, para você receber o valor à vista em qualquer forma de pagamento.
      </p>

      <div className="flex flex-col gap-2">
        {methods.map((method) => {
          const isArchived = method.status === "archived";
          const total = totalFor(method);
          const hasInstallmentFee = method.installments > 1;
          const missing = !isArchived && isMissingFee(method.label, method.installments, total);

          return (
            <div
              key={method.id}
              className={`flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-[var(--gold)]/40 ${isArchived ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{method.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {method.installments > 1 ? `${method.installments} parcelas` : "à vista"}
                  </span>
                </div>

                <div className="flex shrink-0 flex-wrap items-end gap-3">
                  {isArchived ? <StatusPill tone="muted">Oculta</StatusPill> : null}

                  {/* Salva ao sair do campo: evita um botão por linha. */}
                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    Por venda
                    <span className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="99.99"
                        value={fieldsFor(method).admin}
                        placeholder="0"
                        aria-label={`Taxa por venda de ${method.label} em porcentagem`}
                        onChange={(e) => setField(method.id, "admin", e.target.value)}
                        onBlur={() => save(method)}
                        className="w-20 text-right tabular-nums"
                      />
                      <span className="text-xs">%</span>
                    </span>
                  </label>

                  {hasInstallmentFee ? (
                    <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                      Parcelamento
                      <span className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="99.99"
                          value={fieldsFor(method).installment}
                          placeholder="0"
                          aria-label={`Taxa de parcelamento de ${method.label} em porcentagem`}
                          onChange={(e) => setField(method.id, "installment", e.target.value)}
                          onBlur={() => save(method)}
                          className="w-20 text-right tabular-nums"
                        />
                        <span className="text-xs">%</span>
                      </span>
                    </label>
                  ) : null}

                  <div className="flex w-20 flex-col gap-1 text-[11px] text-muted-foreground">
                    Total
                    <span className="flex h-10 items-center justify-end text-sm font-medium tabular-nums text-foreground">
                      {formatPercent(total)}%
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => startTransition(() => togglePaymentMethod(method.id, method.status))}
                  >
                    {isArchived ? "Usar" : "Ocultar"}
                  </Button>
                </div>
              </div>

              {missing ? (
                <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  Sem taxa: você pagaria esse custo do próprio bolso. Preencha com a taxa do banco.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Conferência de valores</p>
            <p className="text-xs text-muted-foreground">
              Digite o preço à vista de uma peça. Se &ldquo;Você recebe&rdquo; mostrar esse mesmo
              valor em todas as linhas, a taxa está sendo repassada por inteiro.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            Preço à vista
            <span className="flex items-center gap-1.5">
              <span className="text-xs">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={previewValue}
                onChange={(e) => setPreviewValue(e.target.value)}
                placeholder="100,00"
                aria-label="Preço à vista para conferência"
                className="w-28 text-right tabular-nums"
              />
            </span>
          </label>
        </div>

        {previewOptions.length > 0 ? (
          <dl className="flex flex-col divide-y divide-border text-sm">
            {previewOptions.map((option) => (
              <div
                key={option.method.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5 tabular-nums"
              >
                <dt>
                  {option.method.label}
                  {option.method.installments > 1 ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {option.method.installments}× de {formatBRL(option.installmentCents)}
                    </span>
                  ) : null}
                </dt>
                <dd className="flex gap-4">
                  <span>Cliente paga {formatBRL(option.priceCents)}</span>
                  <span className="whitespace-nowrap text-muted-foreground">
                    Você recebe {formatBRL(option.netReceivedCents)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">Informe um preço maior que zero.</p>
        )}
      </div>

      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-label">Nova forma</Label>
          <Input id="pm-label" name="label" required maxLength={40} placeholder="Crédito 4x" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-admin-fee">Por venda (%)</Label>
          <Input
            id="pm-admin-fee"
            name="adminFeePercent"
            type="number"
            step="0.01"
            min="0"
            max="99.99"
            className="w-24"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-installment-fee">Parcelamento (%)</Label>
          <Input
            id="pm-installment-fee"
            name="installmentFeePercent"
            type="number"
            step="0.01"
            min="0"
            max="99.99"
            className="w-28"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-installments">Parcelas</Label>
          <Input
            id="pm-installments"
            name="installments"
            type="number"
            min="1"
            max="12"
            defaultValue="1"
            className="w-24"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending} className="self-end">
          {isPending ? "Salvando..." : "Adicionar"}
        </Button>

        {state.error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive sm:col-span-5">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
