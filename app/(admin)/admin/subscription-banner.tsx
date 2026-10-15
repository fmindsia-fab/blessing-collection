import { startCheckout } from "@/lib/stripe/actions";
import { hasStoreAccess } from "@/lib/billing/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

// Aviso fixo no topo do /admin quando a loja não tem acesso comercial. O
// painel continua totalmente acessível — o proprietário precisa conseguir
// entrar para pagar. Só o catálogo público fica indisponível.
export async function SubscriptionBanner({ storeId }: { storeId: string }) {
  if (await hasStoreAccess(storeId)) return null;

  const supabase = await createServerSupabaseClient();
  const { data: subscription } = await supabase
    .from("store_subscriptions")
    .select("status")
    .eq("store_id", storeId)
    .maybeSingle();

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
