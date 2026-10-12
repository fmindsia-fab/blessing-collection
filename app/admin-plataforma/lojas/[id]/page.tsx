import { notFound } from "next/navigation";
import { getStoreForPlatformAdmin } from "@/lib/platform/queries";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusPill } from "@/components/admin/status-pill";
import { BackLink } from "@/components/shared/back-link";
import { StoreStatusToggle } from "./store-status-toggle";

const SUBSCRIPTION_LABEL: Record<string, string> = {
  trialing: "Em teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Não paga",
};

export default async function PlatformAdminStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStoreForPlatformAdmin(id);
  if (!store) notFound();

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <BackLink href="/admin-plataforma">Lojas</BackLink>
      <PageHeading
        kicker={store.slug}
        title={store.name}
        action={<StatusPill tone={store.status === "active" ? "positive" : "muted"}>
          {store.status === "active" ? "Ativa" : "Inativa"}
        </StatusPill>}
      />

      <dl className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border bg-card p-5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="font-medium">{store.whatsapp_number}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Criada em</dt>
          <dd className="font-medium">{new Date(store.created_at).toLocaleDateString("pt-BR")}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Assinatura</dt>
          <dd className="font-medium">
            {store.subscription
              ? (SUBSCRIPTION_LABEL[store.subscription.status] ?? store.subscription.status)
              : "Sem assinatura"}
          </dd>
        </div>
        {store.subscription?.current_period_end ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Próxima renovação</dt>
            <dd className="font-medium">
              {new Date(store.subscription.current_period_end).toLocaleDateString("pt-BR")}
            </dd>
          </div>
        ) : null}
      </dl>

      <StoreStatusToggle storeId={store.id} status={store.status} />
    </div>
  );
}
