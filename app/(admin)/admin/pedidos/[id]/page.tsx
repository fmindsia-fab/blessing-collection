import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getOrder, getOrderProductionList } from "@/lib/orders/queries";
import { formatPhoneBR } from "@/lib/customers/phone-mask";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { ActionLink } from "@/components/ui/action";
import { OrderStatusControl } from "./order-status-control";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const result = await getOrder(store.id, id);
  if (!result) notFound();

  const { order, items } = result;
  const productionList = await getOrderProductionList(id);

  const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <BackLink href="/admin/pedidos">Pedidos</BackLink>

      <PageHeading
        kicker="Encomenda"
        title={order.customer?.name ?? "Cliente"}
        description={order.customer?.phone ? formatPhoneBR(order.customer.phone) : undefined}
        action={
          <ActionLink href={`/admin/pedidos/${id}/editar`} variant="outline" className="h-10 px-5">
            Editar pedido
          </ActionLink>
        }
      />

      <OrderStatusControl orderId={id} status={order.status} />

      <section className="flex flex-col gap-3">
        <span className="kicker">Itens</span>
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-3">
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
          ))}
        </div>
        <p className="text-right text-sm">
          Total: <strong className="tabular-nums">{formatBRL(order.total_amount)}</strong>
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-border p-4">
          <span className="text-sm font-medium">Sinal</span>
          <p className="text-sm tabular-nums">{formatBRL(order.deposit_amount)}</p>
          <p className="text-xs text-muted-foreground">
            {order.deposit_paid_at ? `Pago em ${formatDate(order.deposit_paid_at)}` : "Não pago"}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-border p-4">
          <span className="text-sm font-medium">Saldo</span>
          <p className="text-sm tabular-nums">{formatBRL(order.balance_amount)}</p>
          <p className="text-xs text-muted-foreground">
            {order.balance_paid_at ? `Pago em ${formatDate(order.balance_paid_at)}` : "Não pago"}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="kicker">Prazos</span>
        <p className="text-sm">Pedido em {formatDate(order.order_date)}</p>
        <p className="text-sm">Previsão de entrega: {formatDate(order.expected_delivery_date)}</p>
        {order.delivered_at ? (
          <p className="text-sm">Entregue em {new Date(order.delivered_at).toLocaleDateString("pt-BR")}</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <span className="kicker">Lista de produção</span>
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
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Insumos extras / observações
            </span>
            <p className="whitespace-pre-wrap text-sm">{order.production_notes}</p>
          </div>
        ) : null}
      </section>

      {order.notes ? (
        <section className="flex flex-col gap-2">
          <span className="kicker">Observações</span>
          <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
