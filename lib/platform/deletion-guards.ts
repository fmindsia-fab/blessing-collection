// Travas da exclusão definitiva de conta (ver delete-account.ts). Função pura:
// decide só a partir dos fatos já levantados, sem I/O, para ser testável.

export type DeletionFacts = {
  ownerIsCurrentUser: boolean;
  ownerIsPlatformAdmin: boolean;
  subscription: {
    status: string;
    billing_type: string | null;
    stripe_subscription_id: string | null;
  } | null;
};

const LIVE_STRIPE_STATUSES = new Set(["active", "past_due", "trialing"]);

// Devolve o motivo do bloqueio, ou null se a exclusão pode seguir.
export function getDeletionBlocker(facts: DeletionFacts): string | null {
  if (facts.ownerIsCurrentUser || facts.ownerIsPlatformAdmin) {
    return "Esta conta é de administrador da plataforma e não pode ser excluída por aqui.";
  }

  const sub = facts.subscription;

  // Cortesia = cliente real sem cobrança (ex.: a Blessing). Exige decisão
  // consciente (mudar o tipo de cobrança) antes de apagar qualquer coisa.
  if (sub?.billing_type === "complimentary") {
    return "Loja em cortesia (cliente real). Altere o tipo de cobrança antes de excluir.";
  }

  if (sub?.stripe_subscription_id && LIVE_STRIPE_STATUSES.has(sub.status)) {
    return "Há uma assinatura ativa no Stripe. Cancele-a no Stripe antes de excluir a conta.";
  }

  return null;
}
