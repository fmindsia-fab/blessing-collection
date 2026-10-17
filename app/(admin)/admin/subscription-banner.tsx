import { startCheckout, openBillingPortal } from "@/lib/stripe/actions";
import { hasStoreAccess, PAST_DUE_GRACE_DAYS } from "@/lib/billing/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

// Aviso fixo no topo do /admin quando algo na assinatura pede atenção. O painel
// continua totalmente acessível — o proprietário precisa conseguir entrar para
// pagar. Dois casos:
//  - sem acesso comercial: o catálogo público está fora do ar;
//  - pagamento falhou mas ainda dentro da carência: catálogo no ar, com prazo.
export async function SubscriptionBanner({ storeId }: { storeId: string }) {
  const hasAccess = await hasStoreAccess(storeId);

  const supabase = await createServerSupabaseClient();
  const { data: subscription } = await supabase
    .from("store_subscriptions")
    .select("status, stripe_customer_id, current_period_end")
    .eq("store_id", storeId)
    .maybeSingle();

  // Dentro da carência: avisa e leva ao portal para atualizar o cartão.
  if (hasAccess && subscription?.status === "past_due") {
    const deadline = subscription.current_period_end
      ? new Date(new Date(subscription.current_period_end).getTime() + PAST_DUE_GRACE_DAYS * 86_400_000)
      : null;

    return (
      <div
        role="status"
        className="flex flex-col gap-3 border-b border-border bg-[var(--gold)]/15 px-6 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-10"
      >
        <p className="text-sm">
          Não conseguimos cobrar a sua assinatura.
          {deadline ? ` Regularize até ${deadline.toLocaleDateString("pt-BR")} para o catálogo não sair do ar.` : ""}
        </p>
        {subscription.stripe_customer_id ? (
          <form action={openBillingPortal}>
            <Button type="submit" size="sm">
              Atualizar forma de pagamento
            </Button>
          </form>
        ) : null}
      </div>
    );
  }

  if (hasAccess) return null;

  // trialing aqui significa trial vencido que o job de normalização ainda
  // não marcou como expired.
  const trialEnded =
    !subscription || subscription.status === "trialing" || subscription.status === "expired";

  return (
    <div
      role="status"
      className="flex flex-col gap-3 border-b border-border bg-[var(--gold)]/15 px-6 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-10"
    >
      <p className="text-sm">
        {trialEnded
          ? "Seu período gratuito terminou. Assine o AteliFácil para reativar seu catálogo."
          : "Sua assinatura não está ativa. Regularize para reativar seu catálogo."}
      </p>
      <form action={startCheckout}>
        <Button type="submit" size="sm">
          Assinar agora
        </Button>
      </form>
    </div>
  );
}
