"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { createOrder, updateOrder, type OrderFormState } from "@/lib/orders/actions";
import { formatBRL } from "@/lib/orders/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProductOption = {
  id: string;
  name: string;
  price: number;
  variants: { id: string; product_id: string; name: string; color: string | null; size: string | null; price: number | null }[];
};

type CustomerOption = { id: string; name: string; phone: string | null };
type PaymentMethodOption = { id: string; label: string };

type ItemRow = {
  key: string;
  productId: string;
  variantId: string;
  customName: string;
  customDescription: string;
  quantity: string;
  unitPrice: string;
};

function emptyItem(): ItemRow {
  return {
    key: crypto.randomUUID(),
    productId: "",
    variantId: "",
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
  items?: {
    product_id: string | null;
    variant_id: string | null;
    custom_name: string | null;
    custom_description: string | null;
    quantity: number;
    unit_price: number;
  }[];
}) {
  const action = order ? updateOrder.bind(null, order.id) : createOrder;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((item) => ({
        key: crypto.randomUUID(),
        productId: item.product_id ?? "",
        variantId: item.variant_id ?? "",
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
      variantId: "",
      unitPrice: product ? String(product.price) : "",
    });
  }

  function selectVariant(key: string, item: ItemRow, variantId: string) {
    const product = products.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    updateItem(key, {
      variantId,
      unitPrice: variant?.price != null ? String(variant.price) : item.unitPrice,
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="itemCount" value={items.length} />

      <section className="flex flex-col gap-4">
        <span className="kicker">Cliente e datas</span>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customerId">Cliente</Label>
            <select
              id="customerId"
              name="customerId"
              required
              defaultValue={order?.customer_id ?? ""}
              className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone ? ` — ${customer.phone}` : ""}
                </option>
              ))}
            </select>
            {customers.length === 0 ? (
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

      <section className="flex flex-col gap-3">
        <span className="kicker">Itens do pedido</span>

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
                  <select
                    name={`items[${index}].productId`}
                    value={item.productId}
                    onChange={(e) => selectProduct(item.key, e.target.value)}
                    aria-label="Produto"
                    className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
                  >
                    <option value="">Item avulso / personalizado…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

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

                {!isCustom && product && product.variants.length > 0 ? (
                  <select
                    name={`items[${index}].variantId`}
                    value={item.variantId}
                    onChange={(e) => selectVariant(item.key, item, e.target.value)}
                    aria-label="Variação"
                    className="mt-3 h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
                  >
                    <option value="">Sem variação específica</option>
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                        {v.color ? ` — ${v.color}` : ""}
                        {v.size ? ` — ${v.size}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="hidden" name={`items[${index}].variantId`} value="" />
                )}

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

      <section className="flex flex-col gap-4">
        <span className="kicker">Pagamento</span>
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
              <select
                id="depositPaymentMethodId"
                name="depositPaymentMethodId"
                defaultValue={order?.deposit_payment_method_id ?? ""}
                className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
              >
                <option value="">—</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
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
              <select
                id="balancePaymentMethodId"
                name="balancePaymentMethodId"
                defaultValue={order?.balance_payment_method_id ?? ""}
                className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
              >
                <option value="">—</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <span className="kicker">Observações e produção</span>
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

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="h-11 w-fit px-8">
        {isPending ? "Salvando..." : order ? "Salvar pedido" : "Criar pedido"}
      </Button>
    </form>
  );
}
