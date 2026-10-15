import { notFound } from "next/navigation";
import { getStoreForPlatformAdmin } from "@/lib/platform/queries";
import { billingState, daysUntil } from "@/lib/platform/metrics";
import { BILLING_STATE_LABEL, BILLING_STATE_TONE } from "@/lib/platform/billing-labels";
import { PageHeading } from "@/components/admin/page-heading";
import { StatusPill } from "@/components/admin/status-pill";
import { BackLink } from "@/components/shared/back-link";
import { formatCpfCnpj } from "@/lib/br/document";
import { CRAFT_LABEL, YEARS_ACTIVE_LABEL } from "@/lib/store/craft-profile";
import { formatWhatsappBR } from "@/lib/customers/phone-mask";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDeletionBlocker } from "@/lib/platform/deletion-guards";
import { StoreStatusToggle } from "./store-status-toggle";
import { DeleteAccountSection } from "./delete-account-section";

function yesNo(value: boolean | null) {
  return value === null ? "—" : value ? "Sim" : "Não";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function PlatformAdminStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStoreForPlatformAdmin(id);
  if (!store) notFound();

  const now = new Date();

  // Travas da exclusão definitiva, calculadas aqui só para explicar o motivo
  // na tela; quem de fato impede é a server action.
  const session = await createServerSupabaseClient();
  const [{ data: authData }, { data: ownerProfile }] = await Promise.all([
    session.auth.getUser(),
    session.from("profiles").select("is_platform_admin").eq("id", store.owner_user_id).maybeSingle(),
  ]);
  const deletionBlocker = getDeletionBlocker({
    ownerIsCurrentUser: authData.user?.id === store.owner_user_id,
    ownerIsPlatformAdmin: ownerProfile?.is_platform_admin ?? false,
    subscription: store.subscription,
  });
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
          <InfoRow
            label={store.owner.document?.length === 14 ? "CNPJ" : "CPF"}
            value={store.owner.document ? formatCpfCnpj(store.owner.document) : "—"}
          />
          <InfoRow label="E-mail" value={store.owner.email ?? "—"} breakAll />
          <InfoRow label="WhatsApp" value={formatWhatsappBR(store.whatsapp_number)} />
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

        <InfoCard title="Ateliê">
          <InfoRow
            label="Cidade / UF"
            value={store.city ? `${store.city}${store.state ? ` / ${store.state}` : ""}` : "—"}
          />
          <InfoRow
            label="Artesanato"
            value={
              store.craft_types.length > 0
                ? store.craft_types
                    .map((type) =>
                      type === "other" && store.craft_other ? store.craft_other : (CRAFT_LABEL[type] ?? type),
                    )
                    .join(", ")
                : "—"
            }
          />
          <InfoRow label="Instagram" value={store.instagram_url ?? "—"} breakAll />
          <InfoRow label="Sob medida" value={yesNo(store.accepts_custom_orders)} />
          <InfoRow label="Envia p/ Brasil" value={yesNo(store.ships_nationwide)} />
          <InfoRow label="Tempo de atuação" value={store.years_active ? (YEARS_ACTIVE_LABEL[store.years_active] ?? "—") : "—"} />
          <InfoRow label="Marketplace" value={store.marketplace_opt_in ? "Autorizou divulgação" : "Não autorizou"} />
        </InfoCard>
      </div>

      <StoreStatusToggle storeId={store.id} status={store.status} />

      <DeleteAccountSection
        storeId={store.id}
        slug={store.slug}
        storeName={store.name}
        blocker={deletionBlocker}
      />
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
