import Link from "next/link";
import { listStoresForPlatformAdmin } from "@/lib/platform/queries";
import { billingState, computePlatformMetrics, daysUntil, type BillingState } from "@/lib/platform/metrics";
import { BILLING_STATE_LABEL, BILLING_STATE_TONE } from "@/lib/platform/billing-labels";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusPill } from "@/components/admin/status-pill";
import { cn } from "@/lib/utils";
import { StatCard } from "./stat-card";

type Filter = "todas" | "teste" | "pagas" | "expiradas" | "suspensas";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "teste", label: "Em teste" },
  { key: "pagas", label: "Assinantes" },
  { key: "expiradas", label: "Teste expirado" },
  { key: "suspensas", label: "Suspensas" },
];

function matchesFilter(filter: Filter, storeStatus: string, state: BillingState) {
  switch (filter) {
    case "teste":
      return state === "trial";
    case "pagas":
      return state === "paid";
    case "expiradas":
      return state === "trial_expired";
    case "suspensas":
      return storeStatus !== "active";
    default:
      return true;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function PlatformAdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.key === filtro) ? (filtro as Filter) : "todas";

  const stores = await listStoresForPlatformAdmin();
  const now = new Date();
  const metrics = computePlatformMetrics(stores, now);

  const rows = stores
    .map((store) => ({ store, state: billingState(store.subscription, now) }))
    .filter(({ store, state }) => matchesFilter(filter, store.status, state));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <PageHeading
        kicker="Visão geral"
        title="Painel da plataforma"
        description="Acompanhe lojas, testes grátis e assinaturas do AteliFácil."
      />

      <section aria-labelledby="stores-heading" className="flex flex-col gap-4">
        <h2 id="stores-heading" className="text-sm font-medium text-muted-foreground">
          Lojas
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total de lojas" value={metrics.totalStores} />
          <StatCard label="Lojas ativas" value={metrics.activeStores} tone="positive" />
          <StatCard label="Lojas suspensas" value={metrics.suspendedStores} hint="Catálogo fora do ar" />
          <StatCard label="Novas em 30 dias" value={metrics.newLast30Days} />
        </div>
      </section>

      <section aria-labelledby="billing-heading" className="flex flex-col gap-4">
        <h2 id="billing-heading" className="text-sm font-medium text-muted-foreground">
          Assinaturas
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Assinantes" value={metrics.paid} tone="positive" />
          <StatCard label="Cortesia" value={metrics.complimentary} hint="Sem cobrança" />
          <StatCard label="Em teste grátis" value={metrics.trial} />
          <StatCard label="Teste acaba em 7 dias" value={metrics.trialExpiringSoon} tone="warning" />
          <StatCard label="Teste expirado" value={metrics.trialExpired} tone="warning" hint="Oportunidade de conversão" />
          <StatCard label="Pagamento atrasado" value={metrics.pastDue} tone="danger" />
          <StatCard label="Canceladas" value={metrics.canceled} />
        </div>
      </section>

      <section aria-labelledby="list-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="list-heading" className="text-lg font-semibold tracking-tight">
            Lojas cadastradas
          </h2>
          <nav aria-label="Filtrar lojas" className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "todas" ? "/admin-plataforma" : `/admin-plataforma?filtro=${f.key}`}
                aria-current={f.key === filter ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
                  f.key === filter
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-[var(--radius-image)] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma loja neste filtro.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map(({ store, state }) => {
              const trialEnds = store.subscription?.trial_ends_at;
              const days = trialEnds ? daysUntil(trialEnds, now) : 0;
              const trialNote =
                state === "trial" && trialEnds
                  ? `Teste termina em ${days} dia${days === 1 ? "" : "s"}`
                  : state === "trial_expired" && trialEnds
                    ? `Teste terminou em ${formatDate(trialEnds)}`
                    : null;

              return (
                <li key={store.id}>
                  <Link
                    href={`/admin-plataforma/lojas/${store.id}`}
                    className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border bg-card p-4 outline-none transition-colors hover:border-foreground/25 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-semibold">{store.name}</span>
                      <span className="truncate text-sm text-muted-foreground">
                        {store.slug} · criada em {formatDate(store.created_at)}
                        {trialNote ? ` · ${trialNote}` : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusPill tone={store.status === "active" ? "positive" : "muted"}>
                        {store.status === "active" ? "Loja ativa" : "Suspensa"}
                      </StatusPill>
                      <StatusPill tone={BILLING_STATE_TONE[state]}>{BILLING_STATE_LABEL[state]}</StatusPill>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
