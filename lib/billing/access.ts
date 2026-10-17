import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BillingType, SubscriptionStatus } from "@/types/database.types";

// Regra de acesso comercial da loja — separada de stores.status (estado
// administrativo). Loja com trial expirado/assinatura vencida CONTINUA
// resolvendo como tenant e o /admin segue acessível; só o catálogo público
// fica bloqueado.
//
// Fonte única em produção: a função SQL store_has_access() (migration 0032),
// chamada por hasStoreAccess() — vale para visitante anônimo também e é
// avaliada em tempo real. hasSubscriptionAccess() é o espelho puro dessa
// mesma regra, usado onde a linha da assinatura já foi lida (painéis) e nos
// testes. Se mudar uma, mude a outra.

// Dias de carência após o fim do período pago, enquanto o pagamento está falhando
// (past_due). Espelha o `interval '7 days'` de store_has_access() (migration 0040).
export const PAST_DUE_GRACE_DAYS = 7;

export type SubscriptionAccessInput = {
  status: SubscriptionStatus | string;
  billing_type?: BillingType | string | null;
  trial_ends_at: string | null;
  current_period_end?: string | null;
} | null;

export function hasSubscriptionAccess(subscription: SubscriptionAccessInput, now: Date): boolean {
  if (!subscription) return false;
  if (subscription.status === "active") return true;
  if (subscription.billing_type === "complimentary") return true;
  if (subscription.status === "past_due" && subscription.current_period_end) {
    const graceEndsAt = new Date(subscription.current_period_end).getTime() + PAST_DUE_GRACE_DAYS * 86_400_000;
    return graceEndsAt > now.getTime();
  }
  return (
    subscription.status === "trialing" &&
    subscription.trial_ends_at !== null &&
    new Date(subscription.trial_ends_at) > now
  );
}

// Fail-closed: erro de RPC => sem acesso. Memoizado por requisição para o
// layout e o sitemap/páginas não repetirem a chamada.
export const hasStoreAccess = cache(async (storeId: string): Promise<boolean> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("store_has_access", { p_store_id: storeId });
  if (error) return false;
  return data === true;
});
