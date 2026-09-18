import { notFound } from "next/navigation";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getOrder, listProductsForOrderPicker } from "@/lib/orders/queries";
import { listActiveCustomers } from "@/lib/customers/queries";
import { listPaymentMethods } from "@/lib/pricing/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { BackLink } from "@/components/shared/back-link";
import { OrderForm } from "../../order-form";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getActiveStore();
  const [result, products, customers, paymentMethods] = await Promise.all([
    getOrder(store.id, id),
    listProductsForOrderPicker(store.id),
    listActiveCustomers(store.id),
    listPaymentMethods(store.id),
  ]);

  if (!result) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <BackLink href={`/admin/pedidos/${id}`}>Pedido</BackLink>
      <PageHeading kicker="Encomendas" title="Editar pedido" />
      <OrderForm
        products={products}
        customers={customers}
        paymentMethods={paymentMethods.map((pm) => ({ id: pm.id, label: pm.label }))}
        order={result.order}
        items={result.items}
      />
    </div>
  );
}
