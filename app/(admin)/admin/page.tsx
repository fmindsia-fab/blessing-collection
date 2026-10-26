import { EyeIcon, MessageCircleIcon, PackageIcon, TrendingUpIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductCoverUrls, listAllProductsForAdmin } from "@/lib/products/admin-queries";
import {
  ANALYTICS_PERIODS,
  getAnalyticsTotals,
  getDailySeries,
  getPreviousPeriodTotals,
  getProductRankings,
  parsePeriod,
  PERIOD_LABEL,
} from "@/lib/analytics/queries";
import { PeriodFilter } from "@/components/admin/period-filter";
import { PageHeading } from "@/components/admin/page-heading";
import { ActionLink } from "@/components/ui/action";
import { StatCard } from "@/components/admin/stat-card";
import { TopProducts } from "@/components/admin/top-products";
import { TrendChart } from "@/components/admin/trend-chart";
import { calculateTrend } from "@/lib/analytics/series";
import { TodayCards } from "@/components/admin/today-cards";
import { getTodayCardsData } from "@/lib/dashboard/today";
import { GettingStarted } from "@/components/admin/getting-started";
import { getGettingStarted } from "@/lib/onboarding/getting-started";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const period = parsePeriod(periodo);

  const store = await getActiveStore();
  const [totals, rankings, products, series, previous, todayCards] = await Promise.all([
    getAnalyticsTotals(store.id, period),
    getProductRankings(store.id, period),
    listAllProductsForAdmin(store.id),
    getDailySeries(store.id, period),
    getPreviousPeriodTotals(store.id, period),
    getTodayCardsData(store.id),
  ]);

  // Tendência só quando há período anterior com dados reais para comparar.
  const viewsTrend = previous ? calculateTrend(totals.productViews, previous.productViews) : null;
  const clicksTrend = previous ? calculateTrend(totals.whatsappClicks, previous.whatsappClicks) : null;

  const topFive = rankings.slice(0, 5);
  const covers = await getProductCoverUrls(topFive.map((row) => row.product_id));
  const gettingStarted = await getGettingStarted(
    { id: store.id, logo_url: store.logo_url },
    products.map((product) => product.id),
  );
  const publicProducts = products.filter((product) => product.status !== "inactive").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <PageHeading
          kicker="Painel da loja"
          title="Seu ateliê em destaque ✨"
          description={`Acompanhe o desempenho da sua loja e descubra oportunidades para crescer. Período: ${PERIOD_LABEL[period].toLowerCase()}.`}
        />
        <PeriodFilter basePath="/admin" active={period} periods={ANALYTICS_PERIODS} labels={PERIOD_LABEL} />
      </div>

      <GettingStarted items={gettingStarted} />

      <TodayCards data={todayCards} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={PackageIcon}
          label="Peças no catálogo"
          value={String(publicProducts)}
          hint={`${products.length} peças cadastradas no total`}
        />
        <StatCard
          icon={EyeIcon}
          label="Vezes que viram suas peças"
          value={String(totals.productViews)}
          trend={viewsTrend}
          hint={PERIOD_LABEL[period]}
        />
        <StatCard
          icon={MessageCircleIcon}
          label="Cliques no WhatsApp"
          value={String(totals.whatsappClicks)}
          trend={clicksTrend}
          hint="Vezes que clicaram para chamar você no WhatsApp"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Taxa de interesse"
          value={`${totals.interestRate}%`}
          hint="De cada 100 visualizações, quantas viraram uma conversa no WhatsApp"
        />
      </div>

      {series ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendChart title="Visualizações por dia" points={series.views} singular="visualização" plural="visualizações" />
          <TrendChart title="Cliques no WhatsApp por dia" points={series.clicks} singular="clique" plural="cliques" />
          {series.truncated ? (
            <p className="text-sm text-muted-foreground lg:col-span-2">
              Há muitos registros neste período: os gráficos mostram só uma parte dos dias mais antigos.
            </p>
          ) : null}
        </div>
      ) : null}

      <TopProducts
        title="Top 5 produtos do período"
        rows={topFive}
        covers={covers}
        emptyMessage="Nenhum evento registrado neste período. Compartilhe o link da sua loja para começar a receber visitas."
      />

      <ActionLink href={`/admin/analytics?periodo=${period}`} variant="ghost" arrow className="w-fit">
        Ver analytics completo
      </ActionLink>
    </div>
  );
}
