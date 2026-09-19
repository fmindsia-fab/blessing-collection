import { getActiveStore } from "@/lib/store/get-active-store";
import { listOrders, listOverdueOrders } from "@/lib/orders/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { ActionLink } from "@/components/ui/action";
import { OrdersKanban } from "./orders-kanban";
import { OverdueBanner } from "./overdue-banner";

export default async function AdminOrdersPage() {
  const store = await getActiveStore();
  const [orders, overdueOrders] = await Promise.all([
    listOrders(store.id),
    listOverdueOrders(store.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        kicker="Encomendas"
        title="Pedidos"
        description={`${orders.length} ${orders.length === 1 ? "pedido registrado" : "pedidos registrados"}`}
        action={
          <div className="flex items-center gap-3">
            <ActionLink href="/admin/pedidos/dashboard" variant="outline" className="h-11 px-6">
              Dashboard
            </ActionLink>
            <ActionLink href="/admin/pedidos/calendario" variant="outline" className="h-11 px-6">
              Calendário
            </ActionLink>
            <ActionLink href="/admin/pedidos/novo" variant="solid" className="h-11 px-6">
              Novo pedido
            </ActionLink>
          </div>
        }
      />

      {overdueOrders.length > 0 ? <OverdueBanner orders={overdueOrders} /> : null}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-image)] border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhum pedido registrado ainda.</p>
          <ActionLink href="/admin/pedidos/novo" variant="outline" className="h-11 px-6">
            Registrar o primeiro
          </ActionLink>
        </div>
      ) : (
        <OrdersKanban orders={orders} />
      )}
    </div>
  );
}
