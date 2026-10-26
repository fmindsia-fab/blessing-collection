import { getActiveStore } from "@/lib/store/get-active-store";
import { listProductsForOrderPicker } from "@/lib/orders/queries";
import { listActiveCustomers } from "@/lib/customers/queries";
import { listPaymentMethods } from "@/lib/pricing/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { OrderForm } from "../order-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; contato?: string }>;
}) {
  const { cliente, contato } = await searchParams;
  const store = await getActiveStore();
  const [products, customers, paymentMethods] = await Promise.all([
    listProductsForOrderPicker(store.id),
    listActiveCustomers(store.id),
    listPaymentMethods(store.id),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <BackLink href="/admin/pedidos">Pedidos</BackLink>
      <PageHeading kicker="Encomendas" title="Novo pedido" />
      <OrderForm
        products={products}
        customers={customers}
        defaultCustomerId={cliente && UUID.test(cliente) && customers.some((customer) => customer.id === cliente) ? cliente : undefined}
        leadId={contato && UUID.test(contato) ? contato : undefined}
        paymentMethods={paymentMethods.map((pm) => ({ id: pm.id, label: pm.label }))}
      />
    </div>
  );
}
