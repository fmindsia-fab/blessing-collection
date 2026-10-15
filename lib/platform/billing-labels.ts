import type { BillingState } from "@/lib/platform/metrics";

export const BILLING_STATE_LABEL: Record<BillingState, string> = {
  paid: "Assinante",
  complimentary: "Cortesia",
  trial: "Em teste grátis",
  trial_expired: "Teste expirado",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  none: "Sem assinatura",
};

export const BILLING_STATE_TONE: Record<BillingState, "positive" | "accent" | "neutral" | "muted"> = {
  paid: "positive",
  complimentary: "positive",
  trial: "accent",
  trial_expired: "muted",
  past_due: "muted",
  canceled: "muted",
  none: "neutral",
};
