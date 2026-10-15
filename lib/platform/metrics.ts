// Métricas do painel da plataforma, calculadas em memória a partir da lista
// de lojas (poucas centenas no MVP — dispensa agregação no banco). Funções
// puras: `now` é injetado para ficar testável.

export type SubscriptionRow = {
  status: string;
  billing_type?: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
} | null;

export type StoreRow = {
  status: string;
  created_at: string;
  subscription: SubscriptionRow;
};

export type BillingState =
  | "paid"
  | "complimentary"
  | "trial"
  | "trial_expired"
  | "past_due"
  | "canceled"
  | "none";

const DAY_MS = 24 * 60 * 60 * 1000;
export const TRIAL_EXPIRING_SOON_DAYS = 7;

// Estado "efetivo": trialing com trial_ends_at vencido vira trial_expired
// aqui, sem depender de nenhum job que atualize a coluna.
export function billingState(subscription: SubscriptionRow, now: Date): BillingState {
  if (!subscription) return "none";
  if (subscription.billing_type === "complimentary") return "complimentary";
  switch (subscription.status) {
    case "active":
      return "paid";
    case "expired":
      return "trial_expired";
    case "trialing":
      return subscription.trial_ends_at && new Date(subscription.trial_ends_at) < now
        ? "trial_expired"
        : "trial";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "none";
  }
}

// Dias inteiros restantes (arredonda para cima: "hoje" = 1 até o fim do dia).
export function daysUntil(iso: string, now: Date): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS);
}

export function computePlatformMetrics(stores: StoreRow[], now: Date) {
  const m = {
    totalStores: stores.length,
    activeStores: 0,
    suspendedStores: 0,
    newLast30Days: 0,
    paid: 0,
    complimentary: 0,
    trial: 0,
    trialExpiringSoon: 0,
    trialExpired: 0,
    pastDue: 0,
    canceled: 0,
    withoutSubscription: 0,
  };

  for (const store of stores) {
    if (store.status === "active") m.activeStores += 1;
    else m.suspendedStores += 1;

    if (now.getTime() - new Date(store.created_at).getTime() <= 30 * DAY_MS) m.newLast30Days += 1;

    switch (billingState(store.subscription, now)) {
      case "paid":
        m.paid += 1;
        break;
      case "complimentary":
        m.complimentary += 1;
        break;
      case "trial":
        m.trial += 1;
        if (
          store.subscription?.trial_ends_at &&
          daysUntil(store.subscription.trial_ends_at, now) <= TRIAL_EXPIRING_SOON_DAYS
        ) {
          m.trialExpiringSoon += 1;
        }
        break;
      case "trial_expired":
        m.trialExpired += 1;
        break;
      case "past_due":
        m.pastDue += 1;
        break;
      case "canceled":
        m.canceled += 1;
        break;
      case "none":
        m.withoutSubscription += 1;
        break;
    }
  }

  return m;
}
