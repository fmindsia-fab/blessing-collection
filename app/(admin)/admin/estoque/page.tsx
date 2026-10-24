import Link from "next/link";
import { PackageOpenIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listProductsWithoutMaterials, listStockOverview } from "@/lib/stock/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { EmptyState } from "@/components/admin/empty-state";
import { ActionLink } from "@/components/ui/action";
import { StockList } from "./stock-list";

export default async function StockPage() {
  const store = await getActiveStore();
  const [rows, withoutMaterials] = await Promise.all([
    listStockOverview(store.id),
    listProductsWithoutMaterials(store.id),
  ]);

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

      {withoutMaterials.total > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Peças sem materiais cadastrados{" "}
            <span className="text-sm font-normal text-muted-foreground">({withoutMaterials.total})</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            O estoque só desconta os materiais que estão na receita da peça. Estas peças não têm nenhum material
            cadastrado, então os pedidos delas não descontam nada. Abra a peça e preencha em &quot;Formação de
            preço&quot;.
          </p>
          <ul className="flex flex-col gap-1.5">
            {withoutMaterials.items.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/produtos/${product.id}/editar#preco`}
                  className="text-sm font-medium underline underline-offset-4 hover:text-[var(--gold)]"
                >
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
          {withoutMaterials.total > withoutMaterials.items.length ? (
            <p className="text-sm text-muted-foreground">
              E mais {withoutMaterials.total - withoutMaterials.items.length} peças.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
