"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { createPurchase, type StockFormState } from "@/lib/stock/actions";
import { costChangePercent, quantityFromPackages, unitCostFromPurchase } from "@/lib/stock/calc";
import { formatMoney, formatQuantity, formatUnitCost } from "@/lib/stock/format";
import type { PurchasableMaterial } from "@/lib/stock/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FormFooter } from "@/components/admin/form-footer";
import { cn } from "@/lib/utils";

type ItemDraft = {
  key: number;
  materialId: string;
  byPackage: boolean;
  quantity: string;
  packages: string;
  perPackage: string;
  totalCost: string;
  updateCost: boolean;
};

const initialState: StockFormState = {};

function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyItem(key: number): ItemDraft {
  return { key, materialId: "", byPackage: false, quantity: "", packages: "", perPackage: "", totalCost: "", updateCost: false };
}

function itemQuantity(item: ItemDraft): number {
  return item.byPackage ? quantityFromPackages(toNumber(item.packages), toNumber(item.perPackage)) : toNumber(item.quantity);
}

export function PurchaseForm({
  materials,
  suppliers,
  today,
}: {
  materials: PurchasableMaterial[];
  suppliers: string[];
  today: string;
}) {
  const [state, formAction, isPending] = useActionState(createPurchase, initialState);
  const [items, setItems] = useState<ItemDraft[]>([emptyItem(1)]);
  const [nextKey, setNextKey] = useState(2);
  const [freight, setFreight] = useState("");
  const [paymentMode, setPaymentMode] = useState<"paid" | "later">("paid");
  const [installments, setInstallments] = useState("1");

  const materialById = useMemo(() => new Map(materials.map((material) => [material.id, material])), [materials]);

  function update(key: number, patch: Partial<ItemDraft>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function chooseMaterial(key: number, materialId: string) {
    const material = materialById.get(materialId);
    // Sem custo cadastrado não há o que preservar: já sugere gravar o preço pago.
    update(key, { materialId, updateCost: material ? material.unitCost === 0 : false });
  }

  const itemsTotal = items.reduce((sum, item) => sum + toNumber(item.totalCost), 0);
  const total = itemsTotal + toNumber(freight);

  const payload = JSON.stringify(
    items
      .filter((item) => item.materialId)
      .map((item) => ({
        materialId: item.materialId,
        quantity: itemQuantity(item),
        totalCost: toNumber(item.totalCost),
        updateCost: item.updateCost,
      })),
  );

  if (materials.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Para registrar uma compra, cadastre primeiro os materiais (fio, fecho, alça…).{" "}
        <Link href="/admin/materiais" className="font-medium underline underline-offset-4">
          Ir para Materiais
        </Link>
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="items" value={payload} />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="purchasedAt">Data da compra</Label>
          <Input id="purchasedAt" name="purchasedAt" type="date" defaultValue={today} max={today} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplier">Onde comprou (opcional)</Label>
          <Input id="supplier" name="supplier" list="suppliers" maxLength={80} placeholder="Ex.: Armarinho Central" />
          <datalist id="suppliers">
            {suppliers.map((supplier) => (
              <option key={supplier} value={supplier} />
            ))}
          </datalist>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">O que você comprou</h2>

        {items.map((item, index) => {
          const material = materialById.get(item.materialId);
          const quantity = itemQuantity(item);
          const paid = toNumber(item.totalCost);
          const unitCost = unitCostFromPurchase(paid, quantity);
          const change = material ? costChangePercent(material.unitCost, unitCost) : null;
          const differs = material !== undefined && quantity > 0 && Math.abs(unitCost - material.unitCost) >= 0.005;

          return (
            <article key={item.key} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor={`material-${item.key}`}>Material {items.length > 1 ? index + 1 : ""}</Label>
                  <NativeSelect
                    id={`material-${item.key}`}
                    value={item.materialId}
                    onChange={(event) => chooseMaterial(item.key, event.target.value)}
                  >
                    <option value="">Escolha o material…</option>
                    {materials.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.unit})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                {items.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Tirar o item ${index + 1} da compra`}
                    onClick={() => setItems((current) => current.filter((candidate) => candidate.key !== item.key))}
                    className="mt-6"
                  >
                    <Trash2Icon />
                  </Button>
                ) : null}
              </div>

              {material && !material.tracked ? (
                <p className="rounded-xl bg-[var(--brand-soft)] px-3 py-2.5 text-sm">
                  Este material ainda não tem estoque controlado. Com esta compra ele passa a ter. Se você já tinha
                  sobra, depois use <strong>Ajustar</strong> em Estoque para somar o que já estava guardado.
                </p>
              ) : null}

              {material ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div role="group" aria-label="Como informar a quantidade" className="flex flex-wrap gap-2">
                      {[
                        { value: false, label: `Informar a quantidade (${material.unit})` },
                        { value: true, label: "Contar por embalagem (ex.: novelo)" },
                      ].map((option) => (
                        <button
                          key={String(option.value)}
                          type="button"
                          aria-pressed={item.byPackage === option.value}
                          onClick={() => update(item.key, { byPackage: option.value })}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
                            item.byPackage === option.value
                              ? "border-[var(--gold)] bg-[var(--gold)] text-primary-foreground"
                              : "border-border text-muted-foreground hover:border-[var(--gold)] hover:text-foreground",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {item.byPackage ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={`packages-${item.key}`}>Quantas embalagens</Label>
                          <Input
                            id={`packages-${item.key}`}
                            inputMode="decimal"
                            value={item.packages}
                            onChange={(event) => update(item.key, { packages: event.target.value })}
                            placeholder="Ex.: 5"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={`per-package-${item.key}`}>Quanto tem em cada ({material.unit})</Label>
                          <Input
                            id={`per-package-${item.key}`}
                            inputMode="decimal"
                            value={item.perPackage}
                            onChange={(event) => update(item.key, { perPackage: event.target.value })}
                            placeholder="Ex.: 200"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground sm:col-span-2">
                          Total comprado:{" "}
                          <strong className="text-foreground">
                            {formatQuantity(quantity)} {material.unit}
                          </strong>
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`quantity-${item.key}`}>Quantidade comprada ({material.unit})</Label>
                        <Input
                          id={`quantity-${item.key}`}
                          inputMode="decimal"
                          value={item.quantity}
                          onChange={(event) => update(item.key, { quantity: event.target.value })}
                          placeholder="Ex.: 1000"
                          className="max-w-56"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`cost-${item.key}`}>Quanto você pagou por este item (R$)</Label>
                    <Input
                      id={`cost-${item.key}`}
                      inputMode="decimal"
                      value={item.totalCost}
                      onChange={(event) => update(item.key, { totalCost: event.target.value })}
                      placeholder="0,00"
                      className="max-w-56"
                    />
                  </div>

                  {quantity > 0 && paid >= 0 && item.totalCost !== "" ? (
                    <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-sm">
                      <p>
                        Custo: <strong>{formatUnitCost(unitCost)}</strong> por {material.unit}
                        {material.unitCost > 0 ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · cadastro hoje: {formatUnitCost(material.unitCost)}
                            {change !== null && change !== 0 ? ` (${change > 0 ? "+" : ""}${change}%)` : ""}
                          </span>
                        ) : null}
                      </p>
                      {differs ? (
                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.updateCost}
                            onChange={(event) => update(item.key, { updateCost: event.target.checked })}
                            className="mt-1 size-4 accent-[var(--gold)]"
                          />
                          <span>
                            Atualizar o custo de <strong>{material.name}</strong> para este preço.{" "}
                            <span className="text-muted-foreground">
                              Isso muda a sugestão de preço das peças que usam este material.
                            </span>
                          </span>
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}
            </article>
          );
        })}

        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-fit"
          disabled={items.length >= 50}
          onClick={() => {
            setItems((current) => [...current, emptyItem(nextKey)]);
            setNextKey((current) => current + 1);
          }}
        >
          <PlusIcon /> Adicionar outro item
        </Button>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="freight">Frete (R$, se houver)</Label>
          <Input
            id="freight"
            name="freight"
            inputMode="decimal"
            value={freight}
            onChange={(event) => setFreight(event.target.value.replace(",", "."))}
            placeholder="0,00"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Input id="notes" name="notes" maxLength={500} placeholder="Ex.: nota 1234, pago no Pix" />
        </div>
        <p className="text-base sm:col-span-2">
          Total da compra: <strong className="text-lg tabular-nums">{formatMoney(total)}</strong>
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Como você pagou?</h2>
        <input type="hidden" name="paymentMode" value={paymentMode} />
        <div role="group" aria-label="Como você pagou" className="flex flex-wrap gap-2">
          {[
            { value: "paid" as const, label: "Já paguei" },
            { value: "later" as const, label: "Vou pagar depois (a prazo ou parcelado)" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={paymentMode === option.value}
              onClick={() => setPaymentMode(option.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
                paymentMode === option.value
                  ? "border-[var(--gold)] bg-[var(--gold)] text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-[var(--gold)] hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {paymentMode === "later" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstDue">Vencimento da 1ª parcela</Label>
              <Input id="firstDue" name="firstDue" type="date" min={today} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installments">Em quantas parcelas</Label>
              <Input
                id="installments"
                name="installments"
                inputMode="numeric"
                value={installments}
                onChange={(event) => setInstallments(event.target.value.replace(/\D/g, "").slice(0, 2))}
                className="max-w-32"
              />
            </div>
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Cada parcela vira uma conta em <strong>Contas a pagar</strong>, com o aviso de quando vence.
              {Number(installments) > 1 && total > 0 ? ` Parcelas de cerca de ${formatMoney(total / Number(installments))}.` : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            O valor sai do caixa na data da compra e fica registrado em <strong>Contas a pagar</strong> como paga.
          </p>
        )}
      </section>

      <FormFooter sticky isPending={isPending} error={state.error} submitLabel="Registrar compra" pendingLabel="Registrando..." />
    </form>
  );
}
