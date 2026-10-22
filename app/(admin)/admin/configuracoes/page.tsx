import { getActiveStore, getSiteUrl } from "@/lib/store/get-active-store";
import { getStorePrivate } from "@/lib/store/private";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StoreSettingsForm } from "./store-settings-form";
import { StoreLogoForm } from "./store-logo-form";
import { PageHeading } from "@/components/admin/page-heading";
import { BrandFontUpload } from "./brand-font-upload";
import { ShareButton } from "@/components/shared/share-button";
import { BillingSection } from "./billing-section";
import { getPlanPriceLabel } from "@/lib/stripe/price";
import { PageSection as SettingsSection } from "@/components/admin/page-section";

const CHECKOUT_NOTICE: Record<string, { ok: boolean; text: string }> = {
  sucesso: {
    ok: true,
    text: "Pagamento recebido! Estamos ativando a sua assinatura; em instantes o status abaixo é atualizado.",
  },
  cancelado: {
    ok: false,
    text: "A assinatura não foi concluída. Você pode tentar de novo quando quiser.",
  },
  erro: {
    ok: false,
    text: "Não foi possível abrir o pagamento agora. Tente de novo em instantes; se continuar, fale com o suporte.",
  },
  "outra-conta": {
    ok: false,
    text: "Você está logado com outra conta, que não é a dona desta loja. Entre com a conta da loja para assinar.",
  },
};

const SECTION_LINKS = [
  { id: "dados", label: "Dados da loja" },
  { id: "fonte", label: "Fonte" },
  { id: "logo", label: "Logo" },
  { id: "divulgar", label: "Divulgar" },
  { id: "assinatura", label: "Assinatura" },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const notice = checkout ? CHECKOUT_NOTICE[checkout] : undefined;
  const store = await getActiveStore();
  const storePrivate = await getStorePrivate(store.id);
  const siteUrl = await getSiteUrl();
  const planPriceLabel = await getPlanPriceLabel();

  const supabase = await createServerSupabaseClient();
  const { data: subscription } = await supabase
    .from("store_subscriptions")
    .select(
      "status, billing_type, stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end, cancel_at_period_end, cancel_at",
    )
    .eq("store_id", store.id)
    .maybeSingle();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeading
        kicker="Sua loja"
        title="Configurações"
        description="WhatsApp, redes sociais e identidade visual."
      />
      {notice ? (
        <p
          role={notice.ok ? "status" : "alert"}
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${notice.ok ? "border-[var(--gold)]/40 bg-[var(--brand-soft)]" : "border-destructive/40 bg-destructive/10 text-destructive"}`}
        >
          {notice.text}
        </p>
      ) : null}

      <nav aria-label="Seções das configurações" className="flex flex-wrap gap-2">
        {SECTION_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:border-[var(--gold)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <SettingsSection id="dados" title="Dados da loja">
        <StoreSettingsForm store={{ ...store, pix_key: storePrivate.pix_key }} />
      </SettingsSection>

      <SettingsSection id="fonte">
        <BrandFontUpload
          customFontName={store.custom_font_name}
          hasCustomFont={Boolean(store.custom_font_url)}
        />
      </SettingsSection>

      <SettingsSection id="logo">
        <StoreLogoForm logoUrl={store.logo_url} />
      </SettingsSection>

      <SettingsSection id="divulgar">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold tracking-tight">Divulgar o catálogo</span>
          <span className="text-sm text-muted-foreground">
            Envie o link para clientes por WhatsApp, Instagram ou onde preferir.
          </span>
        </div>
        <ShareButton
          url={siteUrl}
          title={store.name}
          message={`Olha o catálogo da ${store.name}, que peças lindas!`}
          label="Compartilhar catálogo"
          className="w-fit"
        />
        <code className="w-fit max-w-full overflow-x-auto rounded-lg border border-border bg-secondary/60 px-3 py-2 font-mono text-xs text-muted-foreground">
          {siteUrl || "Defina NEXT_PUBLIC_SITE_URL"}
        </code>
      </div>
      </SettingsSection>

      <SettingsSection id="assinatura">
      <BillingSection
        status={subscription?.status ?? null}
        billingType={subscription?.billing_type ?? null}
        hasCustomer={Boolean(subscription?.stripe_customer_id)}
        hasStripeSubscription={Boolean(subscription?.stripe_subscription_id)}
        trialEndsAt={subscription?.trial_ends_at ?? null}
        currentPeriodEnd={subscription?.current_period_end ?? null}
        cancelAtPeriodEnd={subscription?.cancel_at_period_end ?? false}
        cancelAt={subscription?.cancel_at ?? null}
        planPriceLabel={planPriceLabel}
      />
      </SettingsSection>
    </div>
  );
}
