import Link from "next/link";
import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllProductsForAdmin } from "@/lib/products/admin-queries";
import {
  getAnalyticsTotals,
  getProductRankings,
  parsePeriod,
  PERIOD_LABEL,
} from "@/lib/analytics/queries";
import { PeriodFilter } from "@/components/admin/period-filter";
import { PageHeading } from "@/components/admin/page-heading";
import { RankingTable } from "@/components/admin/ranking-table";
import { StatCard } from "@/components/admin/stat-card";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const period = parsePeriod(periodo);

  const store = await getActiveStore();
  const [totals, rankings, products] = await Promise.all([
    getAnalyticsTotals(store.id, period),
    getProductRankings(store.id, period),
    listAllProductsForAdmin(store.id),
  ]);

  const publicProducts = products.filter((product) => product.status !== "inactive").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <PageHeading
          kicker="Visão geral"
          title="Dashboard"
          description={`Indicadores da loja — ${PERIOD_LABEL[period].toLowerCase()}.`}
        />
        <PeriodFilter basePath="/admin" active={period} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Produtos no catálogo"
          value={String(publicProducts)}
          hint={`${products.length} cadastrados no total`}
        />
        <StatCard label="Visualizações de produto" value={String(totals.productViews)} />
        <StatCard label="Cliques no WhatsApp" value={String(totals.whatsappClicks)} />
        <StatCard
          label="Taxa de interesse"
          value={`${totals.interestRate}%`}
          hint="Cliques no WhatsApp por visualização"
        />
      </div>

      <RankingTable
        title="Top 5 produtos do período"
        rows={rankings.slice(0, 5)}
        emptyMessage="Nenhum evento registrado neste período."
        columns={[
          { header: "Produto", cell: (row) => row.product_name },
          { header: "Visualizações", align: "right", cell: (row) => row.views },
          { header: "Cliques", align: "right", cell: (row) => row.clicks },
          { header: "Taxa de interesse", align: "right", cell: (row) => `${row.interest_rate}%` },
        ]}
      />

      <Link
        href={`/admin/analytics?periodo=${period}`}
        className="group inline-flex w-fit items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Ver analytics completo
        <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
