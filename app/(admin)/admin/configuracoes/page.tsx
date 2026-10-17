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

const CHECKOUT_NOTICE: Record<string, { ok: boolean; text: string }> = {
  sucesso: {
    ok: true,
    text: "Pagamento recebido! Estamos ativando a sua assinatura; em instantes o status abaixo é atualizado.",
  },
  cancelado: {
    ok: false,
    text: "A assinatura não foi concluída. Você pode tentar de novo quando quiser.",
  },
  "outra-conta": {
    ok: false,
    text: "Você está logado com outra conta, que não é a dona desta loja. Entre com a conta da loja para assinar.",
  },
};

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
    <div className="flex max-w-xl flex-col gap-8">
      <PageHeading
        kicker="Sua loja"
        title="Configurações"
        description="WhatsApp, redes sociais e identidade visual."
      />
      {notice ? (
        <p
          role={notice.ok ? "status" : "alert"}
          className={`rounded-md border px-3 py-2 text-sm ${notice.ok ? "border-border bg-secondary" : "border-destructive/40 text-destructive"}`}
        >
          {notice.text}
        </p>
      ) : null}
      <StoreSettingsForm store={{ ...store, pix_key: storePrivate.pix_key }} />

      <BrandFontUpload
        customFontName={store.custom_font_name}
        hasCustomFont={Boolean(store.custom_font_url)}
      />

      <StoreLogoForm logoUrl={store.logo_url} />

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Divulgar o catálogo</span>
          <span className="text-xs text-muted-foreground">
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
        <code className="w-fit border border-border bg-secondary/60 px-3 py-2 font-mono text-xs text-muted-foreground">
          {siteUrl || "Defina NEXT_PUBLIC_SITE_URL"}
        </code>
      </div>

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
    </div>
  );
}
