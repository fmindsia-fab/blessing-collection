// Quando o cliente assina AINDA DENTRO do teste grátis próprio (30 dias, sem
// cartão), os dias que sobram são preservados: o Stripe cria a assinatura já em
// período de teste e só cobra quando ele termina (trial_end).
//
// O Checkout exige que trial_end esteja a pelo menos 48 h no futuro; usamos
// 50 h de margem (relógios, latência). Com menos que isso a cobrança é imediata.

const MIN_TRIAL_HOURS = 50;

export type TrialSubscription = {
  status: string;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
} | null;

// Devolve o trial_end em segundos Unix, ou undefined quando não há dias a
// preservar. Só vale para o teste PRÓPRIO: assinatura que já passou pelo Stripe
// (stripe_subscription_id) ou que não está em teste nunca ganha trial de novo
// — senão dava para renovar o teste grátis cancelando e assinando outra vez.
export function computeCheckoutTrialEnd(subscription: TrialSubscription, now: Date): number | undefined {
  if (!subscription) return undefined;
  if (subscription.status !== "trialing") return undefined;
  if (subscription.stripe_subscription_id) return undefined;
  if (!subscription.trial_ends_at) return undefined;

  const endsAtMs = new Date(subscription.trial_ends_at).getTime();
  if (!Number.isFinite(endsAtMs)) return undefined;
  if (endsAtMs - now.getTime() < MIN_TRIAL_HOURS * 3_600_000) return undefined;

  return Math.floor(endsAtMs / 1000);
}
