import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllCustomersForAdmin } from "@/lib/customers/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { CustomersList } from "./customers-list";

export default async function CustomersPage() {
  const store = await getActiveStore();
  const customers = await listAllCustomersForAdmin(store.id);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PageHeading
        kicker="Encomendas"
        title="Clientes"
        description="Cadastre uma vez e reaproveite em todo pedido — histórico de encomendas por cliente."
      />
      <CustomersList customers={customers} />
    </div>
  );
}
