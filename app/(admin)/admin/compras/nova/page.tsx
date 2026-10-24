import { getActiveStore } from "@/lib/store/get-active-store";
import { listPurchasableMaterials, listSuppliers } from "@/lib/stock/queries";
import { STORE_TIME_ZONE } from "@/lib/analytics/series";
import { BackLink } from "@/components/shared/back-link";
import { PageHeading } from "@/components/admin/page-heading";
import { PurchaseForm } from "./purchase-form";

export default async function NewPurchasePage() {
  const store = await getActiveStore();
  const [materials, suppliers] = await Promise.all([listPurchasableMaterials(store.id), listSuppliers(store.id)]);

  // "Hoje" no horário de Brasília (e não em UTC, que vira o dia às 21h daqui).
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink href="/admin/compras">Compras</BackLink>
      <PageHeading
        kicker="Estoque e compras"
        title="Registrar compra"
        description="Anote o que você comprou e quanto pagou. O estoque soma sozinho e o preço fica guardado no histórico."
      />
      <PurchaseForm materials={materials} suppliers={suppliers} today={today} />
    </div>
  );
}
