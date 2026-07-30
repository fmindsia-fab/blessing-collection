import { getActiveStore } from "@/lib/store/get-active-store";
import {
  getAnalyticsTotals,
  getCategoryRankings,
  getCollectionRankings,
  getProductRankings,
  parsePeriod,
  PERIOD_LABEL,
} from "@/lib/analytics/queries";
import { PeriodFilter } from "@/components/admin/period-filter";
import { PageHeading } from "@/components/admin/page-heading";
import { RankingTable } from "@/components/admin/ranking-table";
import { StatCard } from "@/components/admin/stat-card";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const period = parsePeriod(periodo);

  const store = await getActiveStore();
  const [totals, products, categories, collections] = await Promise.all([
    getAnalyticsTotals(store.id, period),
    getProductRankings(store.id, period),
    getCategoryRankings(store.id, period),
    getCollectionRankings(store.id, period),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <PageHeading
          kicker="Interesse dos visitantes"
          title="Analytics"
          description={`Por produto, categoria e coleção — ${PERIOD_LABEL[period].toLowerCase()}.`}
        />
        <PeriodFilter basePath="/admin/analytics" active={period} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visualizações de produto" value={String(totals.productViews)} />
        <StatCard label="Cliques no WhatsApp" value={String(totals.whatsappClicks)} />
        <StatCard
          label="Taxa de interesse"
          value={`${totals.interestRate}%`}
          hint="Cliques no WhatsApp por visualização de produto"
        />
        <StatCard
          label="Visitas a categorias/coleções"
          value={String(totals.categoryViews + totals.collectionViews)}
          hint={`${totals.categoryViews} categorias · ${totals.collectionViews} coleções`}
        />
      </div>

      <RankingTable
        title="Produtos mais procurados"
        description="Top 10 por cliques no WhatsApp, com desempate por visualizações."
        rows={products}
        emptyMessage="Nenhum evento registrado neste período."
        columns={[
          { header: "Produto", cell: (row) => row.product_name },
          { header: "Visualizações", align: "right", cell: (row) => row.views },
          { header: "Cliques", align: "right", cell: (row) => row.clicks },
          { header: "Taxa de interesse", align: "right", cell: (row) => `${row.interest_rate}%` },
        ]}
      />

      <RankingTable
        title="Categorias mais visitadas"
        rows={categories}
        emptyMessage="Nenhuma visita a categorias neste período."
        columns={[
          { header: "Categoria", cell: (row) => row.category_name },
          { header: "Visualizações", align: "right", cell: (row) => row.views },
        ]}
      />

      <RankingTable
        title="Coleções mais visitadas"
        rows={collections}
        emptyMessage="Nenhuma visita a coleções neste período."
        columns={[
          { header: "Coleção", cell: (row) => row.collection_name },
          { header: "Visualizações", align: "right", cell: (row) => row.views },
        ]}
      />
    </div>
  );
}
