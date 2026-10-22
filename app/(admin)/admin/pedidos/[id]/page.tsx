import { notFound } from "next/navigation";
import Image from "next/image";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getOrder, getOrderProductionList } from "@/lib/orders/queries";
import { formatPhoneBR } from "@/lib/customers/phone-mask";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { ActionLink } from "@/components/ui/action";
import { OrderStatusControl } from "./order-status-control";
import { CancelOrderButton } from "./cancel-order-button";
import { InvoiceButton } from "./invoice-button";
import { getStorePrivate } from "@/lib/store/private";
import { StatusPill } from "@/components/admin/status-pill";

function PaymentCard({ label, amount, paidAt }: { label: string; amount: string; paidAt: string | null }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold">{label}</span>
        <StatusPill tone={paidAt ? "positive" : "muted"}>{paidAt ? "Pago" : "Não pago"}</StatusPill>
      </div>
      <p className="text-lg font-semibold tabular-nums">{amount}</p>
      {paidAt ? <p className="text-sm text-muted-foreground">Pago em {paidAt}</p> : null}
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const storePrivate = await getStorePrivate(store.id);
  const result = await getOrder(store.id, id);
  if (!result) notFound();

  const { order, items } = result;
  const productionList = await getOrderProductionList(id);

  const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  // Mesma conta do resumo de pedidos: o pago de cada pedido nunca passa do total.
  const paidAmount =
    (order.deposit_paid_at ? order.deposit_amount : 0) + (order.balance_paid_at ? order.balance_amount : 0);
  const pendingAmount = order.total_amount - Math.min(paidAmount, order.total_amount);
  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <BackLink href="/admin/pedidos">Pedidos</BackLink>

      <PageHeading
        kicker="Encomenda"
        title={order.customer?.name ?? "Cliente"}
        description={order.customer?.phone ? formatPhoneBR(order.customer.phone) : undefined}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <InvoiceButton
              storeName={store.name}
              customerName={order.customer?.name ?? "Cliente"}
              customerPhone={order.customer?.phone ?? null}
              orderDate={order.order_date}
              items={items.map((item) => ({
                name: item.product?.name ?? item.custom_name ?? "Item",
                quantity: item.quantity,
                unitPrice: item.unit_price,
              }))}
              totalAmount={order.total_amount}
              pixKey={storePrivate.pix_key}
            />
            <ActionLink href={`/admin/pedidos/${id}/agradecimento`} variant="outline" className="h-10 px-5">
              Cartão de agradecimento
            </ActionLink>
            <ActionLink href={`/admin/pedidos/${id}/editar`} variant="outline" className="h-10 px-5">
              Editar pedido
            </ActionLink>
          </div>
        }
      />

      <OrderStatusControl orderId={id} status={order.status} />

      <CancelOrderButton orderId={id} cancelled={order.status === "cancelled"} />

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Itens</h2>
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3">
              {item.coverImageUrl ? (
                <Image
                  src={item.coverImageUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-[var(--radius)] border border-border object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius)] border border-dashed border-border text-xs text-muted-foreground">
                  s/foto
                </div>
              )}
              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">
                    {item.product?.name ?? item.custom_name}
                    {item.variant ? ` — ${item.variant.name}` : ""}
                  </span>
                  {item.custom_description ? (
                    <span className="text-xs text-muted-foreground">{item.custom_description}</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {item.quantity} × {formatBRL(item.unit_price)}
                  </span>
                </div>
                <span className="shrink-0 text-sm tabular-nums">
                  {formatBRL(item.quantity * item.unit_price)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-right text-sm">
          Total: <strong className="tabular-nums">{formatBRL(order.total_amount)}</strong>
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Pagamento</h2>
          {order.status === "cancelled" ? null : (
            <p className="text-sm text-muted-foreground">
              Falta receber: <strong className="tabular-nums text-foreground">{formatBRL(pendingAmount)}</strong>
            </p>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PaymentCard label="Sinal" amount={formatBRL(order.deposit_amount)} paidAt={order.deposit_paid_at ? formatDate(order.deposit_paid_at) : null} />
          <PaymentCard label="Saldo" amount={formatBRL(order.balance_amount)} paidAt={order.balance_paid_at ? formatDate(order.balance_paid_at) : null} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Prazos</h2>
        <p className="text-sm">Pedido em {formatDate(order.order_date)}</p>
        <p className="text-sm">Previsão de entrega: {formatDate(order.expected_delivery_date)}</p>
        {order.delivered_at ? (
          <p className="text-sm">Entregue em {new Date(order.delivered_at).toLocaleDateString("pt-BR")}</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Lista de produção</h2>
        <p className="text-xs text-muted-foreground">
          Materiais somados a partir do cadastro de cada peça do pedido, multiplicados pela
          quantidade encomendada.
        </p>
        {productionList.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {productionList.map((material) => (
              <li key={`${material.name}-${material.unit}`} className="flex items-center justify-between py-2.5 text-sm">
                <span>{material.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {material.quantity} {material.unit}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum item do catálogo com materiais cadastrados neste pedido.
          </p>
        )}

        {order.production_notes ? (
          <div className="flex flex-col gap-1 pt-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Insumos extras / observações
            </span>
            <p className="whitespace-pre-wrap text-sm">{order.production_notes}</p>
          </div>
        ) : null}
      </section>

      {order.notes ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Observações</h2>
          <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
