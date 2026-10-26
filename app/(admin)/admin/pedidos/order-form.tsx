"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { createOrder, updateOrder, type OrderFormState } from "@/lib/orders/actions";
import { formatBRL } from "@/lib/orders/labels";
import { formatPhoneBR } from "@/lib/customers/phone-mask";
import { NewCustomerInline } from "./new-customer-inline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormFooter } from "@/components/admin/form-footer";
import {
  groupVariants,
  missingRequiredGroups,
  priceWithVariants,
  variantSurchargeCents,
  type VariantOption,
} from "@/lib/pricing/variants";
import { toCents, toReais } from "@/lib/pricing/money";

type ProductOption = {
  id: string;
  name: string;
  price: number;
  variants: {
    id: string;
    product_id: string;
    name: string;
    color: string | null;
    size: string | null;
    price: number | null;
    variant_group: string | null;
    status: string;
    is_required: boolean;
    allow_multiple: boolean;
  }[];
};

type CustomerOption = { id: string; name: string; phone: string | null };
type PaymentMethodOption = { id: string; label: string };

type ItemRow = {
  key: string;
  productId: string;
  /** Variações escolhidas (nenhuma, uma ou várias; uma de cada grupo). */
  variantIds: string[];
  customName: string;
  customDescription: string;
  quantity: string;
  unitPrice: string;
};

function emptyItem(): ItemRow {
  return {
    key: crypto.randomUUID(),
    productId: "",
    variantIds: [],
    customName: "",
    customDescription: "",
    quantity: "1",
    unitPrice: "",
  };
}

const initialState: OrderFormState = {};

export function OrderForm({
  products,
  customers,
  paymentMethods,
  order,
  items: initialItems,
  defaultCustomerId,
  leadId,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
  paymentMethods: PaymentMethodOption[];
  order?: {
    id: string;
    customer_id: string;
    order_date: string;
    expected_delivery_date: string | null;
    notes: string | null;
    production_notes: string | null;
    deposit_amount: number;
    deposit_paid_at: string | null;
    deposit_payment_method_id: string | null;
    balance_amount: number;
    balance_paid_at: string | null;
    balance_payment_method_id: string | null;
  };
  /** Cliente já escolhida (vindo de "Virar pedido" no funil). */
  defaultCustomerId?: string;
  /** Contato do funil que originou o pedido: ao salvar, ele vira "Fechado". */
  leadId?: string;
  items?: {
    product_id: string | null;
    variant_id: string | null;
    /** Todas as variações do item, quando já salvas. */
    variants?: { id: string | null }[];
    custom_name: string | null;
    custom_description: string | null;
    quantity: number;
    unit_price: number;
  }[];
}) {
  const action = order ? updateOrder.bind(null, order.id) : createOrder;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [customerList, setCustomerList] = useState(customers);
  const [customerId, setCustomerId] = useState(order?.customer_id ?? defaultCustomerId ?? "");

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((item) => ({
        key: crypto.randomUUID(),
        productId: item.product_id ?? "",
        variantIds: (item.variants?.map((variant) => variant.id) ?? [item.variant_id]).filter(
          (id): id is string => Boolean(id),
        ),
        customName: item.custom_name ?? "",
        customDescription: item.custom_description ?? "",
        quantity: String(item.quantity),
        unitPrice: String(item.unit_price),
      }));
    }
    return [emptyItem()];
  });

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + qty * price;
      }, 0),
    [items],
  );

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function selectProduct(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(key, {
      productId,
      variantIds: [],
      unitPrice: product ? String(product.price) : "",
    });
  }

  // Escolhe (ou tira) a variação de UM grupo, mantendo as dos outros grupos, e recalcula o preço do
  // item: preço da peça + o acréscimo de cada variação (mesma conta do catálogo). O preço continua
  // editável depois.
  function applyVariantIds(key: string, productId: string, variantIds: string[]) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const selected = product.variants.filter((variant) => variantIds.includes(variant.id)) as VariantOption[];
    const price = toReais(priceWithVariants(toCents(product.price), selected));

    updateItem(key, { variantIds, unitPrice: String(price) });
  }

  // Grupo de uma escolha só: troca a opção (ou tira, escolhendo "Nenhuma"), mantendo os outros grupos.
  function chooseVariant(key: string, item: ItemRow, groupVariantIds: string[], variantId: string) {
    const kept = item.variantIds.filter((id) => !groupVariantIds.includes(id));
    applyVariantIds(key, item.productId, variantId ? [...kept, variantId] : kept);
  }

  // Grupo que aceita várias escolhas (ex.: duas alças): liga ou desliga uma opção.
  function toggleVariant(key: string, item: ItemRow, variantId: string, checked: boolean) {
    const without = item.variantIds.filter((id) => id !== variantId);
    applyVariantIds(key, item.productId, checked ? [...without, variantId] : without);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="itemCount" value={items.length} />
      {leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Cliente e datas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customerId">Cliente</Label>
            <NativeSelect
              id="customerId"
              name="customerId"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {customerList.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone ? ` — ${formatPhoneBR(customer.phone)}` : ""}
                </option>
              ))}
            </NativeSelect>
            <NewCustomerInline
              onCreated={(customer) => {
                setCustomerList((prev) => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
                setCustomerId(customer.id);
              }}
            />
            {customerList.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma cliente cadastrada.{" "}
                <Link href="/admin/clientes" className="underline underline-offset-2">
                  Cadastrar em Clientes
                </Link>
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orderDate">Data do pedido</Label>
            <Input
              id="orderDate"
              name="orderDate"
              type="date"
              required
              defaultValue={order?.order_date ?? new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expectedDeliveryDate">Previsão de entrega</Label>
            <Input
              id="expectedDeliveryDate"
              name="expectedDeliveryDate"
              type="date"
              defaultValue={order?.expected_delivery_date ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Itens do pedido</h2>

        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            const isCustom = item.productId === "";

            return (
              <div key={item.key} className="rounded-[var(--radius-image)] border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  {/* name direto no campo visível: os valores digitados vão para o
                      submit sem depender de um hidden input espelhando o state, que
                      dessincronizava (valor selecionado no <select> não chegava ao
                      servidor). */}
                  <NativeSelect
                    name={`items[${index}].productId`}
                    value={item.productId}
                    onChange={(e) => selectProduct(item.key, e.target.value)}
                    aria-label="Produto"
                  >
                    <option value="">Item avulso / personalizado…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>

                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                    aria-label="Remover item"
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-destructive focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:opacity-30"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>

                {/* Variações: nenhuma, uma ou várias, uma opção de cada grupo (como a cliente escolhe no
                    catálogo). Escolher recalcula o preço do item; o preço continua editável. */}
                <input type="hidden" name={`items[${index}].variantIds`} value={item.variantIds.join(",")} />
                {!isCustom && product && product.variants.length > 0 ? (
                  <fieldset className="mt-3 flex flex-col gap-3 rounded-xl bg-secondary/40 p-3">
                    <legend className="px-1 text-sm font-semibold">Variações escolhidas (opcional)</legend>
                    {groupVariants(product.variants as VariantOption[]).map((group, groupIndex) => {
                      const groupIds = group.options.map((option) => option.id);
                      const chosenId = item.variantIds.find((id) => groupIds.includes(id)) ?? "";
                      const selectId = `variant-${item.key}-${groupIndex}`;

                      const optionLabel = (option: (typeof group.options)[number]) => {
                        const surcharge = variantSurchargeCents(option, toCents(product.price));
                        return `${option.name}${surcharge > 0 ? ` (+${formatBRL(toReais(surcharge))})` : ""}${
                          option.status === "sold_out" ? " — esgotada" : ""
                        }`;
                      };

                      return (
                        <div key={group.key} className="flex flex-col gap-1.5">
                          <Label htmlFor={group.multiple ? undefined : selectId} className="text-sm font-medium">
                            {group.label}
                            {group.required ? (
                              <span className="font-normal text-muted-foreground"> · escolha obrigatória</span>
                            ) : null}
                            {group.multiple ? (
                              <span className="font-normal text-muted-foreground"> · pode escolher mais de uma</span>
                            ) : null}
                          </Label>

                          {group.multiple ? (
                            <div className="flex flex-col gap-1.5" role="group" aria-label={group.label}>
                              {group.options.map((option) => (
                                <label
                                  key={option.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.variantIds.includes(option.id)}
                                    onChange={(e) => toggleVariant(item.key, item, option.id, e.target.checked)}
                                    className="size-5 shrink-0 accent-[var(--gold)]"
                                  />
                                  <span>{optionLabel(option)}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <NativeSelect
                              id={selectId}
                              value={chosenId}
                              onChange={(e) => chooseVariant(item.key, item, groupIds, e.target.value)}
                            >
                              <option value="">{group.required ? "Escolha uma opção…" : "Nenhuma"}</option>
                              {group.options.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {optionLabel(option)}
                                </option>
                              ))}
                            </NativeSelect>
                          )}
                        </div>
                      );
                    })}
                    {(() => {
                      const chosenByKey: Record<string, string[]> = {};
                      for (const group of groupVariants(product.variants as VariantOption[])) {
                        chosenByKey[group.key] = item.variantIds.filter((candidate) =>
                          group.options.some((option) => option.id === candidate),
                        );
                      }
                      const missing = missingRequiredGroups(
                        groupVariants(product.variants as VariantOption[]),
                        chosenByKey,
                      );
                      return missing.length > 0 ? (
                        <p role="status" className="rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-sm font-medium">
                          Falta a escolha obrigatória: {missing.map((group) => group.name).join(", ")}. A cliente precisa
                          escolher uma opção (você ainda pode salvar o orçamento).
                        </p>
                      ) : null;
                    })()}
                    <p className="text-sm text-muted-foreground">
                      O preço do item soma o acréscimo de cada variação escolhida. Você pode ajustar o valor abaixo.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Precisa de duas opções do mesmo tipo (por exemplo, uma alça obrigatória e outra alça de
                      complemento)? Marque quais são de <strong className="text-foreground">escolha obrigatória</strong> na
                      peça, em{" "}
                      <Link
                        href={`/admin/produtos/${product.id}/editar#variacoes`}
                        className="font-medium underline underline-offset-4 hover:text-[var(--gold)]"
                      >
                        Variações
                      </Link>
                      . As demais passam a aparecer como complementos, num seletor à parte.
                    </p>
                  </fieldset>
                ) : null}

                {isCustom ? (
                  <div className="mt-3 grid gap-3">
                    <Input
                      name={`items[${index}].customName`}
                      value={item.customName}
                      onChange={(e) => updateItem(item.key, { customName: e.target.value })}
                      placeholder="Nome da peça personalizada"
                      aria-label="Nome do item"
                      maxLength={120}
                    />
                    <Textarea
                      name={`items[${index}].customDescription`}
                      value={item.customDescription}
                      onChange={(e) => updateItem(item.key, { customDescription: e.target.value })}
                      placeholder="Detalhes da personalização (cor, tamanho, observações)…"
                      aria-label="Descrição do item"
                      rows={2}
                    />
                  </div>
                ) : (
                  <>
                    <input type="hidden" name={`items[${index}].customName`} value="" />
                    <input type="hidden" name={`items[${index}].customDescription`} value="" />
                  </>
                )}

                <div className="mt-3 grid grid-cols-2 gap-3 sm:w-64">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      name={`items[${index}].quantity`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Preço unitário (R$)</Label>
                    <Input
                      name={`items[${index}].unitPrice`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
        >
          Adicionar item
        </Button>

        <p className="text-right text-sm">
          Total: <strong className="tabular-nums">{formatBRL(total)}</strong>
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Pagamento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border p-4">
            <span className="text-sm font-medium">Sinal</span>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="depositAmount">Valor (R$)</Label>
              <Input
                id="depositAmount"
                name="depositAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={order?.deposit_amount || ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="depositPaidAt">Data do pagamento</Label>
              <Input id="depositPaidAt" name="depositPaidAt" type="date" defaultValue={order?.deposit_paid_at ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="depositPaymentMethodId">Forma de pagamento</Label>
              <NativeSelect
                id="depositPaymentMethodId"
                name="depositPaymentMethodId"
                defaultValue={order?.deposit_payment_method_id ?? ""}
              >
                <option value="">—</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border p-4">
            <span className="text-sm font-medium">Saldo</span>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="balanceAmount">Valor (R$)</Label>
              <Input
                id="balanceAmount"
                name="balanceAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={order?.balance_amount || ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="balancePaidAt">Data do pagamento</Label>
              <Input id="balancePaidAt" name="balancePaidAt" type="date" defaultValue={order?.balance_paid_at ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="balancePaymentMethodId">Forma de pagamento</Label>
              <NativeSelect
                id="balancePaymentMethodId"
                name="balancePaymentMethodId"
                defaultValue={order?.balance_payment_method_id ?? ""}
              >
                <option value="">—</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Observações e produção</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Observações gerais</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={order?.notes ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="productionNotes">Insumos extras / lista de produção manual</Label>
          <Textarea
            id="productionNotes"
            name="productionNotes"
            rows={3}
            placeholder="Materiais que não estão cadastrados na peça, ajustes, medidas específicas…"
            defaultValue={order?.production_notes ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            A lista de materiais cadastrados em cada peça é somada automaticamente na tela do
            pedido — use este campo só para o que não está no cadastro.
          </p>
        </div>
      </section>

      <FormFooter
        sticky
        isPending={isPending}
        error={state.error}
        submitLabel={order ? "Salvar pedido" : "Criar pedido"}
      />
    </form>
  );
}
