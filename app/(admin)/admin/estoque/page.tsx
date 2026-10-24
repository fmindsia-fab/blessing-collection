import { PackageOpenIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listStockOverview } from "@/lib/stock/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { EmptyState } from "@/components/admin/empty-state";
import { ActionLink } from "@/components/ui/action";
import { StockList } from "./stock-list";

export default async function StockPage() {
  const store = await getActiveStore();
  const rows = await listStockOverview(store.id);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeading
        kicker="Estoque e compras"
        title="Estoque de materiais"
        description="Quanto você tem de fio, fecho, alça e outros materiais. As compras somam, e os pedidos em produção descontam."
        action={
          <ActionLink href="/admin/compras/nova" variant="solid" className="h-11 px-6">
            Registrar compra
          </ActionLink>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={PackageOpenIcon}
          action={
            <ActionLink href="/admin/materiais" variant="outline" className="h-11 px-6">
              Cadastrar materiais
            </ActionLink>
          }
        >
          Você ainda não cadastrou materiais. Cadastre seus fios, fechos e alças em Materiais para controlar o estoque.
        </EmptyState>
      ) : (
        <StockList rows={rows} />
      )}
    </div>
  );
}
