import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/platform/metrics";
import { cn } from "@/lib/utils";

const EXPIRING_SOON_DAYS = 7;

// Selo no canto direito do cabeçalho com os dias que faltam do teste grátis.
// Só aparece para trial vigente: assinante, cortesia e trial já vencido (que
// ganha o banner de assinatura) não mostram nada aqui.
export async function TrialDaysBadge({ storeId }: { storeId: string }) {
  const supabase = await createServerSupabaseClient();
  const { data: subscription } = await supabase
    .from("store_subscriptions")
    .select("status, billing_type, trial_ends_at")
    .eq("store_id", storeId)
    .maybeSingle();

  if (
    !subscription ||
    subscription.status !== "trialing" ||
    subscription.billing_type === "complimentary" ||
    !subscription.trial_ends_at
  ) {
    return null;
  }

  const now = new Date();
  if (new Date(subscription.trial_ends_at) <= now) return null;

  const days = daysUntil(subscription.trial_ends_at, now);
  const urgent = days <= EXPIRING_SOON_DAYS;

  return (
    <Link
      href="/admin/configuracoes"
      title="Ver assinatura"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
        urgent
          ? "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15"
          : "border-transparent bg-[var(--gold)]/20 text-foreground hover:bg-[var(--gold)]/30",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", urgent ? "bg-destructive" : "bg-[var(--gold)]")} />
      {days} {days === 1 ? "dia restante" : "dias restantes"}
      <span className="hidden sm:inline"> de teste grátis</span>
    </Link>
  );
}
