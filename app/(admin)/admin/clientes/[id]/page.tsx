import { notFound } from "next/navigation";
import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getCustomer, listCustomerOrders } from "@/lib/customers/queries";
import { ORDER_STATUS_LABEL, formatBRL, formatOrderDate } from "@/lib/orders/labels";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { CustomerForm } from "./customer-form";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const customer = await getCustomer(store.id, id);
  if (!customer) notFound();

  const orders = await listCustomerOrders(store.id, id);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <BackLink href="/admin/clientes">Clientes</BackLink>
      <PageHeading kicker="Encomendas" title={customer.name} />

      <CustomerForm customer={customer} />

      <section className="flex flex-col gap-3">
        <span className="kicker">Histórico de pedidos</span>
        {orders.length > 0 ? (
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/pedidos/${order.id}`}
                className="flex items-center justify-between gap-4 py-3 text-sm outline-none transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40"
              >
                <span>{formatOrderDate(order.order_date)} — {ORDER_STATUS_LABEL[order.status]}</span>
                <span className="tabular-nums">{formatBRL(order.total_amount)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum pedido registrado ainda.</p>
        )}
      </section>
    </div>
  );
}
