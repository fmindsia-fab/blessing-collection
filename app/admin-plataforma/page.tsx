import Link from "next/link";
import { listStoresForPlatformAdmin } from "@/lib/platform/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusPill } from "@/components/admin/status-pill";

const SUBSCRIPTION_LABEL: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Não paga",
};

export default async function PlatformAdminHomePage() {
  const stores = await listStoresForPlatformAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        kicker="Visão geral"
        title="Lojas"
        description={`${stores.length} loja${stores.length === 1 ? "" : "s"} cadastrada${stores.length === 1 ? "" : "s"}`}
      />

      {stores.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma loja cadastrada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {stores.map((store) => (
            <li key={store.id}>
              <Link
                href={`/admin-plataforma/lojas/${store.id}`}
                className="flex flex-col gap-2 rounded-[var(--radius-image)] border border-border bg-card p-4 outline-none transition-colors hover:border-foreground/25 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{store.name}</span>
                  <span className="text-sm text-muted-foreground">{store.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={store.status === "active" ? "positive" : "muted"}>
                    {store.status === "active" ? "Ativa" : "Inativa"}
                  </StatusPill>
                  {store.subscription ? (
                    <StatusPill tone="accent">
                      {SUBSCRIPTION_LABEL[store.subscription.status] ?? store.subscription.status}
                    </StatusPill>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
