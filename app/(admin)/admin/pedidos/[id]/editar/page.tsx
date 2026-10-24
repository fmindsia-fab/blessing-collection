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
      {result.order.stock_consumed_at ? (
        <p role="note" className="rounded-xl border border-[var(--gold)]/40 bg-[var(--brand-soft)] px-4 py-3 text-sm">
          Este pedido já descontou materiais do estoque. Se você trocar as peças ou as quantidades, o estoque{" "}
          <strong>não é refeito sozinho</strong>: use <strong>Ajustar</strong> na tela de Estoque, se precisar.
        </p>
      ) : null}
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
