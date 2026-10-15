import { notFound } from "next/navigation";
import { getStoreForPlatformAdmin } from "@/lib/platform/queries";
import { billingState, daysUntil } from "@/lib/platform/metrics";
import { BILLING_STATE_LABEL, BILLING_STATE_TONE } from "@/lib/platform/billing-labels";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusPill } from "@/components/admin/status-pill";
import { BackLink } from "@/components/shared/back-link";
import { StoreStatusToggle } from "./store-status-toggle";

function formatCpf(digits: string): string {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function PlatformAdminStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStoreForPlatformAdmin(id);
  if (!store) notFound();

  const now = new Date();
  const state = billingState(store.subscription, now);
  const trialEnds = store.subscription?.trial_ends_at ?? null;
  const renewal = store.subscription?.current_period_end ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <BackLink href="/admin-plataforma">Lojas</BackLink>
      <PageHeading
        kicker={store.slug}
        title={store.name}
        description={`Cadastrada em ${formatDate(store.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <StatusPill tone={store.status === "active" ? "positive" : "muted"}>
              {store.status === "active" ? "Loja ativa" : "Suspensa"}
            </StatusPill>
            <StatusPill tone={BILLING_STATE_TONE[state]}>{BILLING_STATE_LABEL[state]}</StatusPill>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Responsável">
          <InfoRow label="Nome" value={store.owner.name ?? "—"} />
          <InfoRow label="CPF" value={store.owner.cpf ? formatCpf(store.owner.cpf) : "—"} />
          <InfoRow label="E-mail" value={store.owner.email ?? "—"} breakAll />
          <InfoRow label="WhatsApp" value={store.whatsapp_number} />
        </InfoCard>

        <InfoCard title="Assinatura">
          <InfoRow label="Situação" value={BILLING_STATE_LABEL[state]} />
          {state === "trial" && trialEnds ? (
            <>
              <InfoRow label="Teste termina em" value={formatDate(trialEnds)} />
              <InfoRow label="Dias restantes" value={String(Math.max(daysUntil(trialEnds, now), 0))} />
            </>
          ) : null}
          {state === "trial_expired" && trialEnds ? (
            <InfoRow label="Teste terminou em" value={formatDate(trialEnds)} />
          ) : null}
          {renewal ? <InfoRow label="Próxima renovação" value={formatDate(renewal)} /> : null}
        </InfoCard>
      </div>

      <StoreStatusToggle storeId={store.id} status={store.status} />
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <dl className="flex flex-col gap-3 text-sm">{children}</dl>
    </section>
  );
}

function InfoRow({ label, value, breakAll }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={breakAll ? "text-right font-medium break-all" : "text-right font-medium"}>{value}</dd>
    </div>
  );
}
