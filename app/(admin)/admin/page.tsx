import { EyeIcon, MessageCircleIcon, PackageIcon, TrendingUpIcon } from "lucide-react";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getProductCoverUrls, listAllProductsForAdmin } from "@/lib/products/admin-queries";
import {
  ANALYTICS_PERIODS,
  getAnalyticsTotals,
  getProductRankings,
  parsePeriod,
  PERIOD_LABEL,
} from "@/lib/analytics/queries";
import { PeriodFilter } from "@/components/admin/period-filter";
import { PageHeading } from "@/components/admin/page-heading";
import { ActionLink } from "@/components/ui/action";
import { StatCard } from "@/components/admin/stat-card";
import { TopProducts } from "@/components/admin/top-products";
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
  const [totals, rankings, products] = await Promise.all([
    getAnalyticsTotals(store.id, period),
    getProductRankings(store.id, period),
    listAllProductsForAdmin(store.id),
  ]);

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
          hint={PERIOD_LABEL[period]}
        />
        <StatCard
          icon={MessageCircleIcon}
          label="Cliques no WhatsApp"
          value={String(totals.whatsappClicks)}
          hint="Vezes que clicaram para chamar você no WhatsApp"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Taxa de interesse"
          value={`${totals.interestRate}%`}
          hint="De cada 100 visualizações, quantas viraram uma conversa no WhatsApp"
        />
      </div>

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
